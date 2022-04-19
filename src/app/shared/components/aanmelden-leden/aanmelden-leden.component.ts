import {Component, OnInit, ViewChild} from '@angular/core';
import {ModalComponent} from "../modal/modal.component";
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {
    HeliosAanwezigLedenDataset,
    HeliosLedenDataset,
    HeliosType,
    HeliosVliegtuigenDataset,
} from "../../../types/Helios";
import {SharedService} from "../../../services/shared/shared.service";
import {LedenService} from "../../../services/apiservice/leden.service";
import {AanwezigLedenService} from "../../../services/apiservice/aanwezig-leden.service";
import {TypesService} from "../../../services/apiservice/types.service";
import {ErrorMessage, SuccessMessage} from "../../../types/Utils";
import {VliegtuigenService} from "../../../services/apiservice/vliegtuigen.service";
import {LidAanwezigEditorComponent} from "../editors/lid-aanwezig-editor/lid-aanwezig-editor.component";

type HeliosTypeExtended = HeliosType & {
  Geselecteerd?: boolean;
}

@Component({
  selector: 'app-aanmelden-leden',
  templateUrl: './aanmelden-leden.component.html',
  styleUrls: ['./aanmelden-leden.component.scss']
})

export class AanmeldenLedenComponent implements OnInit {
  @ViewChild(ModalComponent) private popup: ModalComponent;
  @ViewChild(LidAanwezigEditorComponent) aanmeldEditor: LidAanwezigEditorComponent;

  private datumAbonnement: Subscription; // volg de keuze van de kalender
  datum: DateTime;                       // de gekozen dag in de kalender

  private ledenAbonnement: Subscription;
  leden: HeliosLedenDataset[] = [];
  filteredLeden: HeliosLedenDataset[] = [];

  private aanwezigLedenAbonnement: Subscription;
  aanwezigLeden: HeliosAanwezigLedenDataset[] = [];
  filteredAanwezigLeden: HeliosAanwezigLedenDataset[] = [];

  private typesAbonnement: Subscription;
  vliegtuigTypes: HeliosTypeExtended[];

  private vliegtuigenAbonnement: Subscription;
  vliegtuigen: HeliosVliegtuigenDataset[] = [];

  success: SuccessMessage | undefined;
  error: ErrorMessage | undefined;

  zoekString: string;
  bezig: boolean = false;
  bezigTimer: number;

  geselecteerdLid: HeliosAanwezigLedenDataset | undefined;

  opmerking: string;
  overlandVliegtuig: number | undefined;

  constructor(private readonly ledenService: LedenService,
              private readonly aanwezigLedenService: AanwezigLedenService,
              private readonly vliegtuigenService: VliegtuigenService,
              private readonly typesService: TypesService,
              private readonly sharedService: SharedService) { }

  ngOnInit(): void {
    this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
      this.datum = DateTime.fromObject({
        year: datum.year,
        month: datum.month,
        day: datum.day
      })
    });

    // abonneer op wijziging van vliegtuigen
    this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
      this.vliegtuigen = (vliegtuigen) ? vliegtuigen : [];
    });

    // abonneer op wijziging van leden
    this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
      this.leden = (leden) ? leden : [];
      this.filterLeden();
    });

    // abonneer op wijziging van aanwezige vliegtuigen
    this.aanwezigLedenAbonnement = this.aanwezigLedenService.aanwezigChange.subscribe(dataset => {
      // Als er data is, even in juiste formaat zetten. Aanwezig moet hetzelfde formaat hebben als vliegtuigen
      this.aanwezigLeden = (dataset) ? dataset : [];
      this.filterLeden();

      this.bezig = false;
      clearTimeout(this.bezigTimer);
    });

    // abonneer op wijziging van vliegtuigTypes
    this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
      this.vliegtuigTypes = dataset!.filter((t: HeliosType) => {
        return t.GROEP == 4
      });
      for (let i=0 ; i< this.vliegtuigTypes.length ; i++)
      {
        this.vliegtuigTypes[i].Geselecteerd = false;
      }
      this.vliegtuigTypes.sort(function compareFn(a, b) {
        const vA = (a.SORTEER_VOLGORDE) ? a.SORTEER_VOLGORDE : 100;
        const vB = (b.SORTEER_VOLGORDE) ? b.SORTEER_VOLGORDE : 100;

        return vA - vB;
      });
    });
  }

  ngOnDestroy() {
    if (this.datumAbonnement)                 this.datumAbonnement.unsubscribe();
    if (this.typesAbonnement)                 this.typesAbonnement.unsubscribe();
    if (this.ledenAbonnement)                 this.ledenAbonnement.unsubscribe();
    if (this.aanwezigLedenAbonnement)         this.aanwezigLedenAbonnement.unsubscribe();
  }

  openPopup() {
    this.popup.open();
  }

  openLidAanwezigEditor(lidAanwzig: HeliosAanwezigLedenDataset) {
    this.aanmeldEditor.openPopup(lidAanwzig);
  }

  // toon geen vliegtuigen die al aangemeld zijn
  filterLeden() {
    if (!this.leden) {                       // er is niets te filteren
      this.filteredLeden = [];
      return;
    }

    if (!this.aanwezigLeden) {              // er is niets te filteren
      this.filteredLeden = this.leden;
      this.filteredAanwezigLeden = [];
      return;
    }

    this.filteredLeden = this.leden.filter((lid: HeliosLedenDataset) => {
      switch(lid.LIDTYPE_ID)
      {
        case 601:  break;  // Erelid
        case 602:  break;  // Lid
        case 603:  break;  // Jeugdlid
        default: {
          return false;
        }
      }

      if (this.aanwezigLeden.findIndex(a => a.LID_ID == lid.ID) < 0)
        return true;
    });

    if (this.zoekString && this.zoekString.length > 0) {
      this.filteredLeden = this.filteredLeden.filter((al) => (al.NAAM?.toLowerCase().includes(this.zoekString.toLowerCase())))
      this.filteredAanwezigLeden = this.aanwezigLeden.filter((al) => (al.NAAM?.toLowerCase().includes(this.zoekString.toLowerCase())));
    }
    else {
      this.filteredAanwezigLeden = this.aanwezigLeden;
    }
  }

  aanmelden(geslecteerdLid: HeliosLedenDataset) {
    this.bezig = true;

    let voorkeur : string = '';
    for (let i=0 ; i< this.vliegtuigTypes.length ; i++)
    {
      if (this.vliegtuigTypes[i].Geselecteerd) {
        voorkeur += (voorkeur == '') ? '' : ',';
        voorkeur += this.vliegtuigTypes[i].ID!.toString();
      }
    }

    const record: HeliosAanwezigLedenDataset = {
      DATUM: this.datum.year + "-" + this.datum.month + "-" + this.datum.day,

      LID_ID: geslecteerdLid?.ID,
      OPMERKINGEN: this.opmerking,
      VOORKEUR_VLIEGTUIG_TYPE: (voorkeur != "") ? voorkeur : undefined,
      OVERLAND_VLIEGTUIG_ID: this.overlandVliegtuig
    }

    this.aanwezigLedenService.aanmelden(record).then((a) => {
      if (a.LID_ID == geslecteerdLid?.ID) {
        this.success = {titel: "Aanmelden", beschrijving: "Lid is aangemeld"}
        this.aanwezigLedenService.updateAanwezigCache (this.datum, this.datum);
      }
    }).catch(e => {
      this.error = e;
    });

    // na 5 seconden bezit boolean uitzetten. Als getObjects event eerder is, wordt het via het abbonement uitgezet
    this.bezigTimer = window.setTimeout(() => this.bezig = false, 5000);
  }

  afmelden(geselecteerdAanwezig: HeliosAanwezigLedenDataset) {
    this.bezig = true;

    if (geselecteerdAanwezig?.AANKOMST) {
      const d = DateTime.fromSQL(geselecteerdAanwezig?.AANKOMST)

      if (d.diffNow("minute").minutes > -10) {
        this.aanwezigLedenService.aanmeldingVerwijderen(geselecteerdAanwezig!.ID!).then(() => {
          this.success = {titel: "Afmelden", beschrijving: "Lid aanmelding is verwijderd"}
          this.aanwezigLedenService.updateAanwezigCache (this.datum, this.datum);
        }).catch(e => {
          this.error = e;
        });
      } else {
        this.aanwezigLedenService.afmelden(geselecteerdAanwezig!.LID_ID!).then((a) => {
          if (a.LID_ID == geselecteerdAanwezig?.LID_ID) {
            this.success = {titel: "Afmelden", beschrijving: "Lid is afgemeld"}
          }
        }).catch(e => {
          this.error = e;
        });
      }

      // na 5 seconden bezit boolean uitzetten. Als getObjects event eerder is, wordt het via het abbonement uitgezet
      this.bezigTimer = window.setTimeout(() => this.bezig = false, 5000);
    }
  }

  // zet vinkje geselecteerd in de vliegtuig types. Wordt later gebruikt om toe te voegen bij aanmelden
  zetVoorkeur(event: Event, id: number) {
    const idx = this.vliegtuigTypes.findIndex(t => t.ID == id)

    this.vliegtuigTypes[idx].Geselecteerd = (<HTMLInputElement>event.target).checked;
  }

  // Iemand gaat een plaatsje omhoog in de lijst
  omhoog() {
    const idx = this.aanwezigLeden.findIndex(a => a.ID == this.geselecteerdLid!.ID)

    if (idx > 0) {
      this.aanwezigLeden[idx].POSITIE = this.aanwezigLeden[idx].POSITIE!-1;
      this.aanwezigLeden[idx-1].POSITIE = this.aanwezigLeden[idx-1].POSITIE!+1;

      this.aanwezigLeden.sort(function compareFn(a, b) {
        // sorteer op je startlijst positie, heb je geen positie, dan sta je achteraan
        const posA = (a.POSITIE) ? a.POSITIE : 10000;
        const posB = (b.POSITIE) ? b.POSITIE : 10000;

        return posA - posB;
      });

      this.aanwezigLedenService.updateAanmelding({
        ID: this.aanwezigLeden[idx].ID,
        POSITIE: this.aanwezigLeden[idx].POSITIE
      }).then(() => {
        this.aanwezigLedenService.updateAanmelding({
          ID: this.aanwezigLeden[idx-1].ID,
          POSITIE: this.aanwezigLeden[idx-1].POSITIE
        }).then(() => this.aanwezigLedenService.updateAanwezigCache (this.datum, this.datum));
      });
    }
  }


  // Iemand moet zijn plaats afstaand aan iemand anders en zakt op de lijst
  omlaag() {
    const idx = this.aanwezigLeden.findIndex(a => a.ID == this.geselecteerdLid!.ID)

    if ((idx >= 0) && (idx < this.aanwezigLeden.length-1)) {
      this.aanwezigLeden[idx].POSITIE = this.aanwezigLeden[idx].POSITIE!+1
      this.aanwezigLeden[idx+1].POSITIE = this.aanwezigLeden[idx+1].POSITIE!-1

      this.aanwezigLeden.sort(function compareFn(a, b) {
        // sorteer op je startlijst positie, heb je geen positie, dan sta je achteraan
        const posA = (a.POSITIE) ? a.POSITIE : 10000;
        const posB = (b.POSITIE) ? b.POSITIE : 10000;

        return posA - posB;
      });

      this.aanwezigLedenService.updateAanmelding({
        ID: this.aanwezigLeden[idx].ID,
        POSITIE: this.aanwezigLeden[idx].POSITIE
      }).then(() => {
        this.aanwezigLedenService.updateAanmelding({
          ID: this.aanwezigLeden[idx+1].ID,
          POSITIE: this.aanwezigLeden[idx+1].POSITIE
        }).then(() => this.aanwezigLedenService.updateAanwezigCache (this.datum, this.datum));
      });
    }
  }

  selecteerLid(lid: HeliosAanwezigLedenDataset) {
    if (!this.geselecteerdLid) {
      this.geselecteerdLid = lid
    }
    else if (this.geselecteerdLid.ID == lid.ID) {
      this.geselecteerdLid = undefined
    }
    else {
      this.geselecteerdLid = lid;
    }
  }
}
