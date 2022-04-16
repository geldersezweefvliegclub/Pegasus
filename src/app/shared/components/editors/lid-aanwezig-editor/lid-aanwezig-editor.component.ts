import {Component, OnInit, ViewChild} from '@angular/core';
import {ModalComponent} from "../../modal/modal.component";
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {HeliosAanwezigLedenDataset, HeliosType, HeliosVliegtuigenDataset} from "../../../../types/Helios";
import {Subscription} from "rxjs";
import {TypesService} from "../../../../services/apiservice/types.service";
import {AanwezigLedenService} from "../../../../services/apiservice/aanwezig-leden.service";
import {VliegtuigenService} from "../../../../services/apiservice/vliegtuigen.service";

type HeliosTypeExtended = HeliosType & {
  Geselecteerd?: boolean;
}

@Component({
  selector: 'app-lid-aanwezig-editor',
  templateUrl: './lid-aanwezig-editor.component.html',
  styleUrls: ['./lid-aanwezig-editor.component.scss']
})
export class LidAanwezigEditorComponent implements OnInit {
  @ViewChild(ModalComponent) private popup: ModalComponent;

  success: SuccessMessage | undefined;
  error: ErrorMessage | undefined;
  aanwezig: HeliosAanwezigLedenDataset;

  isLoading: boolean = false;
  isSaving: boolean = false;
  formTitel: string = "";

  private typesAbonnement: Subscription;
  vliegtuigTypes: HeliosTypeExtended[];

  private vliegtuigenAbonnement: Subscription;
  vliegtuigen: HeliosVliegtuigenDataset[] = [];

  constructor(private readonly aanwezigLedenService: AanwezigLedenService,
              private readonly vliegtuigenService: VliegtuigenService,
              private readonly typesService: TypesService) { }

  ngOnInit(): void {
    // abonneer op wijziging van vliegtuigen
    this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
      this.vliegtuigen = (vliegtuigen) ? vliegtuigen : [];
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

  // open popup, maar haal eerst de start op. De eerder ingevoerde tijd wordt als default waarde gebruikt
  // indien niet eerder ingvuld, dan de huidige tijd. Buiten de daglicht periode is het veld leeg
  openPopup(record: HeliosAanwezigLedenDataset) {
    this.aanwezig = record;
    this.vliegtuigType2Vinkjes();

    // Ophalen uit de database, er kan iets veranderd zijn
    this.isLoading = true
    this.aanwezigLedenService.getAanwezigLid(record.ID!).then((a) => {
      this.isLoading = false;
      this.aanwezig = a;
      this.vliegtuigType2Vinkjes();
    }).catch(e => {
      this.isLoading = false;
      this.error = e;
    });

    this.formTitel = 'Aanmelding: ' + record.NAAM
    this.popup.open();
  }

  // zet vinkje geselecteerd in de vliegtuig types. Wordt later gebruikt om toe te voegen bij aanmelden
  zetVoorkeur(event: Event, id: number) {
    const idx = this.vliegtuigTypes.findIndex(t => t.ID == id)

    this.vliegtuigTypes[idx].Geselecteerd = (<HTMLInputElement>event.target).checked;

    let voorkeur : string = '';
    for (let i=0 ; i< this.vliegtuigTypes.length ; i++)
    {
      if (this.vliegtuigTypes[i].Geselecteerd) {
        voorkeur += (voorkeur == '') ? '' : ',';
        voorkeur += this.vliegtuigTypes[i].ID!.toString();
      }
    }
    this.aanwezig.VOORKEUR_VLIEGTUIG_TYPE = (voorkeur !== "") ? voorkeur : undefined;
  }

  vliegtuigType2Vinkjes()
  {
    this.vliegtuigTypes.forEach((vliegtuigType) => {
      vliegtuigType.Geselecteerd = false;
    });

    this.aanwezig.VOORKEUR_VLIEGTUIG_TYPE?.split(',').forEach((vliegtuigTypeID) => {
      const idx = this.vliegtuigTypes.findIndex(t => t.ID == parseInt(vliegtuigTypeID))

      if (idx >= 0) {
        this.vliegtuigTypes[idx].Geselecteerd = true;
      }
    });
  }

  opslaan() {
    this.isSaving;

    this.aanwezigLedenService.updateAanmelding(this.aanwezig).then(a => {
      this.aanwezig = a;
      this.isSaving = false;
      this.popup.close();
    }).catch(e => {
      this.error = e;
      this.isSaving = false;
    })
  }
}
