import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {
    HeliosType,
    HeliosStart,
    HeliosVliegtuigenDataset,
    HeliosLedenDataset,
    HeliosAanwezigLedenDataset, HeliosDagInfo
} from "../../../../types/Helios";
import {TypesService} from "../../../../services/apiservice/types.service";
import {ModalComponent} from "../../modal/modal.component";
import {StartlijstService} from "../../../../services/apiservice/startlijst.service";
import {VliegtuigenService} from "../../../../services/apiservice/vliegtuigen.service";
import {AanwezigVliegtuigService} from "../../../../services/apiservice/aanwezig-vliegtuig.service";

import {Observable, of, Subscription} from "rxjs";

import {DateTime} from "luxon";
import {LedenService} from "../../../../services/apiservice/leden.service";
import {AanwezigLedenService} from "../../../../services/apiservice/aanwezig-leden.service";
import {SharedService} from "../../../../services/shared/shared.service";
import {DaginfoService} from "../../../../services/apiservice/daginfo.service";

@Component({
    selector: 'app-start-editor',
    templateUrl: './start-editor.component.html',
    styleUrls: ['./start-editor.component.scss']
})
export class StartEditorComponent {
    @Output() add: EventEmitter<HeliosStart> = new EventEmitter<HeliosStart>();
    @Output() update: EventEmitter<HeliosStart> = new EventEmitter<HeliosStart>();
    @Output() delete: EventEmitter<number> = new EventEmitter<number>();
    @Output() restore: EventEmitter<number> = new EventEmitter<number>();

    @ViewChild(ModalComponent) private popup: ModalComponent;

    start: HeliosStart = {};
    toonVliegerNaam: boolean = false;
    toonStartMethode: boolean = true;

    startMethodeTypes: HeliosType[];
    startMethodeTypesFiltered: HeliosType[];
    veldenTypes$: Observable<HeliosType[]>;

    vliegtuigen: HeliosVliegtuigenDataset[] = [];
    aanwezigVliegtuigen: HeliosVliegtuigenDataset[] = [];
    gekozenVliegtuig: HeliosVliegtuigenDataset;     // het gekozen vliegtuig uit de editor

    // 607 = zusterclub
    // 609 = nieuwlid
    // 610 = oprotkabel
    // 612 = penningmeester
    // 613 = systeem gebruiker
    // 625 = DDWV'er
    exclLidtypeAlsInzittende: string = "607,609,610,612,613,625"
    exclLidtypeAlsVlieger: string = "613"
    leden: HeliosAanwezigLedenDataset[] = [];
    aanwezigLeden: HeliosAanwezigLedenDataset[] = [];

    datumAbonnement: Subscription;
    datum: DateTime;                       // de gekozen dag inn de kalender

    isLoading: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    formTitel: string = "";

    constructor(
        private readonly startlijstService: StartlijstService,
        private readonly vliegtuigenService: VliegtuigenService,
        private readonly aanwezigVliegtuigenService: AanwezigVliegtuigService,
        private readonly ledenService: LedenService,
        private readonly aanwezigLedenService: AanwezigLedenService,
        private readonly typesService: TypesService,
        private readonly daginfoService: DaginfoService,
        private readonly sharedService: SharedService)
    {
        this.typesService.getTypes(5).then(types => this.startMethodeTypes = types);
        this.typesService.getTypes(9).then(types => this.veldenTypes$ = of(types));

        // Alle vliegtuigen ophalen
        this.vliegtuigenService.getVliegtuigen().then((dataset) => {
            this.vliegtuigen = dataset;
        });

        // nu alle leden ophalen en in goede formaat zetten
        this.ledenService.getLeden().then((dataset) => {
            for (let i = 0; i < dataset.length; i++) {
                this.leden.push(
                    {
                        LID_ID: dataset[i].ID,
                        NAAM: dataset[i].NAAM,
                        LIDTYPE_ID: dataset[i].LIDTYPE_ID,
                        VOORKEUR_VLIEGTUIG_TYPE: "",
                        OVERLAND_VLIEGTUIG_ID: -1
                    });
            }
        });
    }

    openPopup(id: number | null) {
        // de datum zoals die in de kalender gekozen is, we halen dan de dag afhankelijke gegevens op
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })

            // ophalen welke leden vandaag aanwezig zijn
            this.aanwezigLedenService.getAanwezig(this.datum, this.datum).then((dataset) => {
                // alle aanwezig leden
                this.aanwezigLeden = dataset;
            });

            // ophalen welke vliegtuigen vandaag aanwezig zijn
            this.aanwezigVliegtuigenService.getAanwezig(this.datum, this.datum).then((dataset) => {
                // Als er data is, even in juiste formaat zetten. Aanwezig moet hetzelfde formaat hebben als vliegtuigen
                this.aanwezigVliegtuigen = [];

                for (let i = 0; i < dataset.length; i++) {
                    this.aanwezigVliegtuigen.push(
                        {
                            ID: dataset[i].VLIEGTUIG_ID,
                            REGISTRATIE: dataset[i].REGISTRATIE,
                            REG_CALL: dataset[i].REG_CALL,
                            CALLSIGN: dataset[i].CALLSIGN,
                            TYPE_ID: dataset[i].TYPE_ID,
                            SLEEPKIST: dataset[i].SLEEPKIST,
                            TMG: dataset[i].TMG,
                            ZELFSTART: dataset[i].ZELFSTART,
                            CLUBKIST: dataset[i].CLUBKIST,
                            ZITPLAATSEN: dataset[i].ZITPLAATSEN
                        });
                }
            });
        })


        if (id) {
            this.formTitel = 'Start bewerken';
            this.haalStartOp(id);
        } else {
            this.formTitel = 'Start aanmaken';
            this.start = {
                ID: undefined,
                DATUM: this.datum.toISODate(),
                DAGNUMMER: undefined,
                VLIEGTUIG_ID: undefined,
                VLIEGER_ID: undefined,
                INZITTENDE_ID: undefined,
                VLIEGERNAAM: undefined,
                INZITTENDENAAM: undefined,
                STARTTIJD: undefined,
                LANDINGSTIJD: undefined,

                STARTMETHODE_ID: this.daginfoService.dagInfo.STARTMETHODE_ID,
                VELD_ID: this.daginfoService.dagInfo.VELD_ID,
                SLEEPKIST_ID: undefined,
                SLEEP_HOOGTE: undefined,

                OPMERKINGEN: undefined,
                EXTERNAL_ID: undefined
            };
console.log(this.start);
            // zet de juiste parameters (doe alsof er invoer heeft plaatsgevonden)
            this.vliegtuigGeselecteerd(this.start.VLIEGTUIG_ID);
            this.vliegerGeselecteerd(this.start.VLIEGER_ID)
        }
        this.isVerwijderMode = false;
        this.isRestoreMode = false;

        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }

    haalStartOp(id: number): void {
        this.isLoading = true;

        try {
            this.startlijstService.getStart(id).then((start) => {
                this.start = start;
                this.isLoading = false;

                // zet de juiste parameters (doe alsof er invoer heeft plaatsgevonden)
                this.vliegtuigGeselecteerd(this.start.VLIEGTUIG_ID);
                this.vliegerGeselecteerd(this.start.VLIEGER_ID);

                // vliegtuigen & leden kunnen nog niet geladen zijn, daarom herhalen we het nog een keer
                setTimeout(() => {
                    this.vliegtuigGeselecteerd(this.start.VLIEGTUIG_ID);
                    this.vliegerGeselecteerd(this.start.VLIEGER_ID);
                }, 2000);
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    // Er is een vliegtuig geselecteerd in de dropdown box
    vliegtuigGeselecteerd(id: number | undefined) {
        this.start.VLIEGTUIG_ID = id;
        this.gekozenVliegtuig = this.vliegtuigen.find(vliegtuig => vliegtuig.ID == id) as HeliosVliegtuigenDataset;

        this.startMethodeTypesFiltered = [];

        if (this.gekozenVliegtuig) {
            // 501 = Slepen
            // 550 = Lierstart
            if (!this.gekozenVliegtuig.TMG && !this.gekozenVliegtuig.SLEEPKIST) {
                this.toonStartMethode = true;
                this.startMethodeTypesFiltered.push(this.startMethodeTypes.find(type => type.ID == 501) as HeliosType);
                this.startMethodeTypesFiltered.push(this.startMethodeTypes.find(type => type.ID == 550) as HeliosType);
            }

            // 507 = Zelfstart
            if (this.gekozenVliegtuig.ZELFSTART) {
                this.toonStartMethode = true;
                this.startMethodeTypesFiltered.push(this.startMethodeTypes.find(type => type.ID == 507) as HeliosType);
            }

            // Deze kunnen niet gesleept of gelierd worden
            if (this.gekozenVliegtuig.TMG || this.gekozenVliegtuig.SLEEPKIST) {
                this.startMethodeTypesFiltered.push(this.startMethodeTypes.find(type => type.ID == 507) as HeliosType);
                this.start.STARTMETHODE_ID = 507;
                this.toonStartMethode = false;
            }
        }

        // Indien clubkist dan mogen er een aantal lidtypes hierop niet vliegen
        // 607 = zusterclub
        // 610 = oprotkabel
        // 613 = systeem gebruiker
        // 625 = DDWV'er
        this.exclLidtypeAlsVlieger = (this.gekozenVliegtuig?.CLUBKIST) ? "607,610,613,625" : "613";
    }

    // De vlieger is nu ingevoerd
    vliegerGeselecteerd(id: number | undefined) {
        this.start.VLIEGER_ID = id;
        const gekozenVlieger = this.leden.find(lid => lid.LID_ID == id) as HeliosLedenDataset;

        if (!gekozenVlieger) {
            this.toonVliegerNaam = false;
        } else {
            switch (gekozenVlieger.LIDTYPE_ID) {
                case 607:   // zusterclub
                case 609:   // nieuw lid
                case 610:   // oprotkabel
                case 612:   // penningmeester
                {
                    this.toonVliegerNaam = true;
                    break;
                }
                default: {
                    this.toonVliegerNaam = false;
                    break;
                }
            }
        }
    }


    openVerwijderPopup(id: number) {
        this.haalStartOp(id);
        this.formTitel = 'Start verwijderen';
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    openRestorePopup(id: number) {
        this.haalStartOp(id);
        this.formTitel = 'Start herstellen';
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    uitvoeren() {
        if (this.isRestoreMode) {
            this.restore.emit(this.start.ID);
        }

        if (this.isVerwijderMode) {
            this.delete.emit(this.start.ID);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.start.ID) {
                this.update.emit(this.start);
            } else {
                this.add.emit(this.start);
            }
        }
    }

    omwisselen() {
        const tmpID: number | undefined = this.start.VLIEGER_ID;
        this.vliegerGeselecteerd(this.start.INZITTENDE_ID);
        this.start.INZITTENDE_ID = tmpID;
    }
}
