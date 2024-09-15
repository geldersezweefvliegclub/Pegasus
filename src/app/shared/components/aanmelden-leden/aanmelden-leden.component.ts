import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { Subscription } from 'rxjs';
import { DateTime } from 'luxon';
import {
  HeliosAanwezigLedenDataset,
  HeliosLedenDataset,
  HeliosType,
  HeliosVliegtuigenDataset,
} from '../../../types/Helios';
import { SharedService } from '../../../services/shared/shared.service';
import { LedenService } from '../../../services/apiservice/leden.service';
import { AanwezigLedenService } from '../../../services/apiservice/aanwezig-leden.service';
import { TypesService } from '../../../services/apiservice/types.service';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import { VliegtuigenService } from '../../../services/apiservice/vliegtuigen.service';
import { LidAanwezigEditorComponent } from '../editors/lid-aanwezig-editor/lid-aanwezig-editor.component';
import { DaginfoService } from '../../../services/apiservice/daginfo.service';

type HeliosTypeExtended = HeliosType & {
    Geselecteerd?: boolean;
}

@Component({
    selector: 'app-aanmelden-leden',
    templateUrl: './aanmelden-leden.component.html',
    styleUrls: ['./aanmelden-leden.component.scss']
})

export class AanmeldenLedenComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @ViewChild(LidAanwezigEditorComponent) aanmeldEditor: LidAanwezigEditorComponent;

    @Input() vliegveld: number | undefined;

    private datumAbonnement: Subscription; // volg de keuze van de kalender
    datum: DateTime = DateTime.now();      // de gekozen dag in de kalender

    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];
    filteredLeden: HeliosLedenDataset[] = [];

    private aanwezigLedenAbonnement: Subscription;
    aanwezigLeden: HeliosAanwezigLedenDataset[] = [];
    filteredAanwezigLeden: HeliosAanwezigLedenDataset[] = [];

    private vliegtuigenAbonnement: Subscription;
    vliegtuigen: HeliosVliegtuigenDataset[] = [];

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    zoekString: string;
    bezig = false;
    bezigTimer: number;

    geselecteerdLid: HeliosAanwezigLedenDataset | undefined;

    constructor(private readonly ledenService: LedenService,
                private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly daginfoService: DaginfoService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly aanwezigLedenService: AanwezigLedenService) {
    }

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

        // abonneer op wijziging van aanwezige ledeb
        this.aanwezigLedenAbonnement = this.aanwezigLedenService.aanwezigChange.subscribe(dataset => {
            // Als er starts is, even in juiste formaat zetten. Aanwezig moet hetzelfde formaat hebben als vliegtuigen
            this.aanwezigLeden = (dataset) ? dataset : [];
            this.filterLeden();

            this.bezig = false;
            clearTimeout(this.bezigTimer);
        });
    }

    ngOnDestroy() {
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.ledenAbonnement) this.ledenAbonnement.unsubscribe();
        if (this.vliegtuigenAbonnement) this.vliegtuigenAbonnement.unsubscribe();
        if (this.aanwezigLedenAbonnement) this.aanwezigLedenAbonnement.unsubscribe();
    }

    openPopup() {
        this.filterLeden();
        this.popup.open();
    }

    openLidAanwezigEditor(lidAanwezig: HeliosAanwezigLedenDataset) {
        this.aanmeldEditor.openPopup(lidAanwezig);
    }

    nieuwLidAanwezigEditor(lid: HeliosLedenDataset) {

        // aanmelden op een vliegveld. Via filter of daginfo
        let vliegveld = this.vliegveld;
        if (!vliegveld) {
            vliegveld = this.daginfoService.dagInfo.VELD_ID
        }

        const lidAanwezig: HeliosAanwezigLedenDataset = {
            LID_ID: lid.ID,
            VELD_ID: vliegveld,
            NAAM: lid.NAAM
        }
        this.aanmeldEditor.openPopup(lidAanwezig);
    }

    // toon geen leden die al aangemeld zijn
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
            switch (lid.LIDTYPE_ID) {
                case 600:
                    break;  // Student
                case 601:
                    break;  // Erelid
                case 602:
                    break;  // Lid
                case 603:
                    break;  // Jeugdlid
                case 604:
                    break;  // Private owner
                case 608:
                    break;  // 5 rittenkaart houder
                case 611:
                    break;  // Cursist
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
        } else {
            this.filteredAanwezigLeden = this.aanwezigLeden;
        }

        if (this.vliegveld) {
            this.filteredAanwezigLeden = this.filteredAanwezigLeden.filter((al) => (al.VELD_ID == this.vliegveld))
        }
    }

    afmelden(geselecteerdAanwezig: HeliosAanwezigLedenDataset) {
        this.bezig = true;

        if (geselecteerdAanwezig?.AANKOMST) {
            const d = DateTime.fromSQL(geselecteerdAanwezig?.AANKOMST)

            if (d.diffNow("minute").minutes > -10) {
                this.aanwezigLedenService.aanmeldingVerwijderen(geselecteerdAanwezig!.ID!).then(() => {
                    this.success = {titel: "Afmelden", beschrijving: "Lid aanmelding is verwijderd"}
                    this.aanwezigLedenService.updateAanwezigCache(true);
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

    // Iemand gaat een plaatsje omhoog in de lijst
    omhoog() {
        const idx = this.aanwezigLeden.findIndex(a => a.ID == this.geselecteerdLid!.ID)

        if (idx > 0) {
            this.aanwezigLeden[idx].POSITIE = this.aanwezigLeden[idx].POSITIE! - 1;
            this.aanwezigLeden[idx - 1].POSITIE = this.aanwezigLeden[idx - 1].POSITIE! + 1;

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
                    ID: this.aanwezigLeden[idx - 1].ID,
                    POSITIE: this.aanwezigLeden[idx - 1].POSITIE
                }).then(() => this.aanwezigLedenService.updateAanwezigCache(true));
            });
        }
    }


    // Iemand moet zijn plaats afstaand aan iemand anders en zakt op de lijst
    omlaag() {
        const idx = this.aanwezigLeden.findIndex(a => a.ID == this.geselecteerdLid!.ID)

        if ((idx >= 0) && (idx < this.aanwezigLeden.length - 1)) {
            this.aanwezigLeden[idx].POSITIE = this.aanwezigLeden[idx].POSITIE! + 1
            this.aanwezigLeden[idx + 1].POSITIE = this.aanwezigLeden[idx + 1].POSITIE! - 1

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
                    ID: this.aanwezigLeden[idx + 1].ID,
                    POSITIE: this.aanwezigLeden[idx + 1].POSITIE
                }).then(() => this.aanwezigLedenService.updateAanwezigCache(true));
            });
        }
    }

    selecteerLid(lid: HeliosAanwezigLedenDataset) {
        if (!this.geselecteerdLid) {
            this.geselecteerdLid = lid
        } else if (this.geselecteerdLid.ID == lid.ID) {
            this.geselecteerdLid = undefined
        } else {
            this.geselecteerdLid = lid;
        }
    }
}
