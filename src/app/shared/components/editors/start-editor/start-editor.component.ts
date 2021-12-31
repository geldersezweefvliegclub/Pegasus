import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {
    HeliosAanwezigLedenDataset,
    HeliosLedenDataset,
    HeliosStart, HeliosStartDataset,
    HeliosType,
    HeliosVliegtuigenDataset,
    HeliosBehaaldeProgressieDataset
} from '../../../../types/Helios';
import {TypesService} from '../../../../services/apiservice/types.service';
import {ModalComponent} from '../../modal/modal.component';
import {StartlijstService} from '../../../../services/apiservice/startlijst.service';
import {VliegtuigenService} from '../../../../services/apiservice/vliegtuigen.service';
import {AanwezigVliegtuigService} from '../../../../services/apiservice/aanwezig-vliegtuig.service';

import {Observable, of, Subscription} from 'rxjs';

import {DateTime} from 'luxon';
import {LedenService} from '../../../../services/apiservice/leden.service';
import {AanwezigLedenService} from '../../../../services/apiservice/aanwezig-leden.service';
import {SharedService} from '../../../../services/shared/shared.service';
import {DaginfoService} from '../../../../services/apiservice/daginfo.service';
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {NgSelectComponent} from "@ng-select/ng-select";
import {VliegtuigInvoerComponent} from "./vliegtuig-invoer/vliegtuig-invoer.component";
import {ProgressieService} from "../../../../services/apiservice/progressie.service";

@Component({
    selector: 'app-start-editor',
    templateUrl: './start-editor.component.html',
    styleUrls: ['./start-editor.component.scss']
})
export class StartEditorComponent implements OnInit {
    @Input() VliegerID: number;                                 // wordt gezet bij aanroep vanuit logboek
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @ViewChild(VliegtuigInvoerComponent) vliegtuigInvoerComponent: VliegtuigInvoerComponent;

    start: HeliosStart = {};
    toonVliegerNaam: boolean = false;
    toonStartMethode: boolean = true;
    toonWaarschuwing: boolean = false;          // mag het lid op die vliegtuig vliegen volgens kruisjeslijst?

    private typesAbonnement: Subscription;
    startMethodeTypes: HeliosType[];
    startMethodeTypesFiltered: HeliosType[];
    veldenTypes$: Observable<HeliosType[]>;
    baanTypes$: Observable<HeliosType[]>;

    private vliegtuigenAbonnement: Subscription;
    vliegtuigen: HeliosVliegtuigenDataset[] = [];
    private aanwezigVliegtuigenAbonnement: Subscription;
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

    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];

    private aanwezigLedenAbonnement: Subscription;
    aanwezigLeden: HeliosAanwezigLedenDataset[] = [];

    private datumAbonnement: Subscription;      // volg de keuze van de kalender
    datum: DateTime;                            // de gekozen dag

    isLoading: boolean = false;
    isSaving: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    formTitel: string = "";

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(
        private readonly startlijstService: StartlijstService,
        private readonly vliegtuigenService: VliegtuigenService,
        private readonly aanwezigVliegtuigenService: AanwezigVliegtuigService,
        private readonly progressieService: ProgressieService,
        private readonly ledenService: LedenService,
        private readonly aanwezigLedenService: AanwezigLedenService,
        private readonly typesService: TypesService,
        private readonly daginfoService: DaginfoService,
        private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is, we halen dan de dag afhankelijke gegevens op
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
        });

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.startMethodeTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 5});
            this.veldenTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 9}));
            this.baanTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 1}));
        });

        // abonneer op wijziging van vliegtuigen
        this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
            this.vliegtuigen = (vliegtuigen) ? vliegtuigen : [];
        });

        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.leden = (leden) ? leden : [];
        });

        // abonneer op wijziging van aanwezige leden
        this.aanwezigLedenAbonnement = this.aanwezigLedenService.aanwezigChange.subscribe(dataset => {
            this.aanwezigLeden = dataset!;
        });

        // abonneer op wijziging van aanwezige vliegtuigen
        this.aanwezigVliegtuigenAbonnement = this.aanwezigVliegtuigenService.aanwezigChange.subscribe(dataset => {
            // Als er data is, even in juiste formaat zetten. Aanwezig moet hetzelfde formaat hebben als vliegtuigen
            this.aanwezigVliegtuigen = [];

            for (let i = 0; i < dataset!.length; i++) {
                this.aanwezigVliegtuigen.push(
                    {
                        ID: dataset![i].VLIEGTUIG_ID,
                        REGISTRATIE: dataset![i].REGISTRATIE,
                        REG_CALL: dataset![i].REG_CALL,
                        CALLSIGN: dataset![i].CALLSIGN,
                        TYPE_ID: dataset![i].TYPE_ID,
                        SLEEPKIST: dataset![i].SLEEPKIST,
                        TMG: dataset![i].TMG,
                        ZELFSTART: dataset![i].ZELFSTART,
                        CLUBKIST: dataset![i].CLUBKIST,
                        ZITPLAATSEN: dataset![i].ZITPLAATSEN
                    });
            }
        });
    }

    openPopup(start: HeliosStartDataset | null) {
        if (start) {
            // vul alvast de editor met data uit het grid
            this.start = {
                ID: start.ID,
                DATUM: start.DATUM,
                DAGNUMMER: start.DAGNUMMER,
                VLIEGTUIG_ID: start.VLIEGTUIG_ID,
                VLIEGER_ID: start.VLIEGER_ID,
                INZITTENDE_ID: start.INZITTENDE_ID,
                VLIEGERNAAM: start.VLIEGERNAAM,
                INZITTENDENAAM: start.INZITTENDENAAM,
                STARTTIJD: start.STARTTIJD,
                LANDINGSTIJD: start.LANDINGSTIJD,

                STARTMETHODE_ID: start.STARTMETHODE_ID,
                VELD_ID: start.VELD_ID,
                BAAN_ID: start.BAAN_ID,
                SLEEPKIST_ID: start.SLEEPKIST_ID,
                SLEEP_HOOGTE: start.SLEEP_HOOGTE,

                OPMERKINGEN: start.OPMERKINGEN,
                EXTERNAL_ID: start.EXTERNAL_ID
            };
            if (start.ID) {
                this.formTitel = 'Start bewerken';
                this.haalStartOp(start.ID as number); // maar data kan gewijzigd zijn, dus toch even data ophalen van API
            }
            else
            {
                this.formTitel = `Start aanmaken ${this.datum.day}-${this.datum.month}-${this.datum.year}`;

                // zet de juiste parameters (doe alsof er invoer heeft plaatsgevonden)
                this.vliegtuigGeselecteerd(this.start.VLIEGTUIG_ID);
                this.vliegerGeselecteerd(this.start.VLIEGER_ID);
            }
        } else {
            this.formTitel = `Start aanmaken ${this.datum.day}-${this.datum.month}-${this.datum.year}`;
            this.start = {
                ID: undefined,
                DATUM: this.datum.toISODate(),
                DAGNUMMER: undefined,
                VLIEGTUIG_ID: undefined,
                VLIEGER_ID: (this.VliegerID) ? this.VliegerID : undefined,      // Vlieger ID is bekend als we vanuit logboek start toevoegen
                INZITTENDE_ID: undefined,
                VLIEGERNAAM: undefined,
                INZITTENDENAAM: undefined,
                STARTTIJD: undefined,
                LANDINGSTIJD: undefined,

                STARTMETHODE_ID: this.daginfoService.dagInfo.STARTMETHODE_ID,
                VELD_ID: this.daginfoService.dagInfo.VELD_ID,
                BAAN_ID: this.daginfoService.dagInfo.BAAN_ID,
                SLEEPKIST_ID: undefined,
                SLEEP_HOOGTE: undefined,

                OPMERKINGEN: undefined,
                EXTERNAL_ID: undefined
            };

            // zet de juiste parameters (doe alsof er invoer heeft plaatsgevonden)
            this.vliegtuigGeselecteerd(this.start.VLIEGTUIG_ID);
            this.vliegerGeselecteerd(this.start.VLIEGER_ID)
        }
        this.isVerwijderMode = false;
        this.isRestoreMode = false;
        this.isSaving = false;

        this.popup.open();

        // open de lijst met vliegtuigen, bij aan,maken nieuwe start
        if (!start) {
            this.vliegtuigInvoerComponent.ngSelect.open();
        }
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
        this.vliegtuigTypeBevoegd();

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
                this.startMethodeTypesFiltered.push(this.startMethodeTypes.find(type => type.ID == 506) as HeliosType);
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
        const gekozenVlieger = this.leden.find(lid => lid.ID == id) as HeliosLedenDataset;

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
        this.vliegtuigTypeBevoegd();
    }

    // De inzittende is nu ook bekend
    inzittendeGeselecteerd($event: number) {
        this.start.INZITTENDE_ID = $event;
        this.vliegtuigTypeBevoegd();
    }

    openVerwijderPopup(id: number) {
        this.haalStartOp(id);
        this.formTitel = 'Start verwijderen';

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    openRestorePopup(id: number) {
        this.haalStartOp(id);
        this.formTitel = 'Start herstellen';

        this.isSaving = false;
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    uitvoeren() {
        this.isSaving = true;
        if (this.isRestoreMode) {
            this.Herstellen(this.start);
        }

        if (this.isVerwijderMode) {
            this.Verwijderen(this.start);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.start.ID) {
                this.Aanpassen(this.start);
            } else {
                this.Toevoegen(this.start);
            }
        }
    }

    // nieuwe start is ingevoerd, nu opslaan
    Toevoegen(start: HeliosStart) {
        this.startlijstService.addStart(start).then((s) => {
            this.success = {
                titel: "Startlijst",
                beschrijving: `Vlucht #${s.DAGNUMMER} is toegevoegd`
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // bestaande start is aangepast, nu opslaan
    Aanpassen(start: HeliosStart) {
        this.startlijstService.updateStart(start).then(() => {
            this.success = {
                titel: "Startlijst",
                beschrijving: `Vlucht #${start.DAGNUMMER} is aangepast`
            }

            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // markeer een start als verwijderd
    Verwijderen(start: HeliosStart) {
        this.startlijstService.deleteStart(start.ID!).then(() => {
            this.success = {
                titel: "Startlijst",
                beschrijving: `Vlucht #${start.DAGNUMMER} is verwijderd`
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        });
    }

    // de start moet hersteld worden, haal de markering 'verwijderd' weg
    Herstellen(start: HeliosStart) {
        this.startlijstService.restoreStart(start.ID!).then(() => {
            this.success = {
                titel: "Startlijst",
                beschrijving: `Vlucht #${start.DAGNUMMER} is hersteld`
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        });
    }

    vliegtuigTypeBevoegd() {
        // moeten natuurlijk vlieger en vliegtuig ingevoerd hebben
        if (!this.start.VLIEGTUIG_ID || !this.start.VLIEGER_ID) {
            this.toonWaarschuwing = false;
            return;
        }

        // alleen controle op clubvliegtuigen
        if (this.gekozenVliegtuig.CLUBKIST == false) {
            return;
        }

        if (this.start.INZITTENDE_ID) {
            const inzittende = this.leden.find(lid => lid.ID == this.start.INZITTENDE_ID) as HeliosLedenDataset;

            if (inzittende.INSTRUCTEUR == true) {  // als inzittende een instructeur is, geven we geen waarschuwing
                this.toonWaarschuwing = false;
                return;
            }
        }

        let competentieIDs: string = "";
        if (this.gekozenVliegtuig.BEVOEGDHEID_LOKAAL_ID) {
            competentieIDs = this.gekozenVliegtuig.BEVOEGDHEID_LOKAAL_ID.toString();
        }
        if (this.gekozenVliegtuig.BEVOEGDHEID_OVERLAND_ID) {
            if (competentieIDs != "") {
                competentieIDs += ",";
            }
            competentieIDs += this.gekozenVliegtuig.BEVOEGDHEID_OVERLAND_ID;
        }

        if (competentieIDs == "") {             // Blijkbaar is er geen bevoegdheid nodig
            this.toonWaarschuwing = false;
            return;
        }

        this.progressieService.getProgressie(this.start.VLIEGER_ID, competentieIDs).then((progressie:  HeliosBehaaldeProgressieDataset[]) => {
            this.toonWaarschuwing = progressie.length > 0 ? false : true;
        });
    }

    omwisselen() {
        const tmpID: number | undefined = this.start.VLIEGER_ID;
        this.vliegerGeselecteerd(this.start.INZITTENDE_ID);
        this.start.INZITTENDE_ID = tmpID;
    }

    StartMethodeIngevuld(): string {
        if (this.start.STARTMETHODE_ID) {
            return ""
        }
        else {
            return "SMinvalid"
        }
    }

    opslaanDisabled() {
        if (!this.start.VLIEGTUIG_ID || !this.start.STARTMETHODE_ID || !this.start.VELD_ID) {
            return true;
        }

        if (this.toonVliegerNaam && !this.start.VLIEGERNAAM) {
            return true;
        }
        return false;
    }
}
