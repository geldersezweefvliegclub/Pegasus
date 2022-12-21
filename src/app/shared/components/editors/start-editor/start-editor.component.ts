import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {
    HeliosAanwezigLedenDataset,
    HeliosBehaaldeProgressieDataset,
    HeliosLedenDataset,
    HeliosStart,
    HeliosStartDataset,
    HeliosType,
    HeliosVliegtuigenDataset
} from '../../../../types/Helios';
import {TypesService} from '../../../../services/apiservice/types.service';
import {ModalComponent} from '../../modal/modal.component';
import {StartlijstService} from '../../../../services/apiservice/startlijst.service';
import {VliegtuigenService} from '../../../../services/apiservice/vliegtuigen.service';
import {AanwezigVliegtuigService} from '../../../../services/apiservice/aanwezig-vliegtuig.service';
import {Observable, of, Subscription} from 'rxjs';
import {DateTime, Interval} from 'luxon';
import {LedenService} from '../../../../services/apiservice/leden.service';
import {AanwezigLedenService} from '../../../../services/apiservice/aanwezig-leden.service';
import {SharedService} from '../../../../services/shared/shared.service';
import {DaginfoService} from '../../../../services/apiservice/daginfo.service';
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {VliegtuigInvoerComponent} from "./vliegtuig-invoer/vliegtuig-invoer.component";
import {ProgressieService} from "../../../../services/apiservice/progressie.service";
import {LoginService} from "../../../../services/apiservice/login.service";
import {PegasusConfigService} from "../../../../services/shared/pegasus-config.service";
import {NgbDate, NgbDateParserFormatter} from "@ng-bootstrap/ng-bootstrap";
import {NgbDateFRParserFormatter} from "../../../ngb-date-fr-parser-formatter";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faStreetView} from "@fortawesome/free-solid-svg-icons";

@Component({
    selector: 'app-start-editor',
    templateUrl: './start-editor.component.html',
    styleUrls: ['./start-editor.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class StartEditorComponent implements OnInit {
    @Input() VliegerID: number;                     // wordt gezet bij aanroep vanuit logboek
    @Input() VliegveldID: number | undefined;       // wordt gezet als we van start / vluchten een start aanmaken
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @ViewChild(VliegtuigInvoerComponent) vliegtuigInvoerComponent: VliegtuigInvoerComponent;

    gastIcon: IconDefinition = faStreetView;

    start: HeliosStart = {};
    toonGastCombobox: boolean = false;
    toonVliegerNaam: boolean = false;
    toonInzittendeNaam: number = 0;
    toonStartMethode: boolean = true;
    toonWaarschuwing: boolean = false;          // mag het lid op die vliegtuig vliegen volgens kruisjeslijst?
    medicalWaarschuwing: boolean = false;       // Controleer op geldigheid medical

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
    // 610 = oprotkabel
    // 612 = penningmeester
    // 613 = systeem gebruiker
    // 625 = DDWV'er
    exclLidtypeAlsInzittende: string = "607,610,612,613"
    exclLidtypeAlsVlieger: string = "613"

    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];

    private aanwezigLedenAbonnement: Subscription;
    aanwezigLeden: HeliosAanwezigLedenDataset[] = [];

    private datumAbonnement: Subscription;      // volg de keuze van de kalender
    datum: DateTime = DateTime.now();           // de gekozen dag

    isLoading: boolean = false;
    isSaving: boolean = false;
    magAltijdWijzigen: boolean = false;
    magDatumAanpassen: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    formTitel: string = "";

    vandaag: DateTime = DateTime.now();
    minDatum: DateTime = DateTime.now();
    startDatum: DateTime;
    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(
        private readonly startlijstService: StartlijstService,
        private readonly vliegtuigenService: VliegtuigenService,
        private readonly aanwezigVliegtuigenService: AanwezigVliegtuigService,
        private readonly progressieService: ProgressieService,
        private readonly ledenService: LedenService,
        private readonly loginService: LoginService,
        private readonly configService: PegasusConfigService,
        private readonly aanwezigLedenService: AanwezigLedenService,
        private readonly typesService: TypesService,
        private readonly daginfoService: DaginfoService,
        private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.magAltijdWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT) ? true : false;

        if (ui?.isBeheerder || ui?.isBeheerderDDWV) {
            this.minDatum = DateTime.fromObject({year: this.vandaag.year, month:1, day:1})
        }
        else {
            this.minDatum = this.vandaag.plus({days: -1 * this.configService.maxZelfEditDagen()});
        }

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
            // Als er starts is, even in juiste formaat zetten. Aanwezig moet hetzelfde formaat hebben als vliegtuigen
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
            // vul alvast de editor met starts uit het grid
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
                PAX: start.PAX,
                CHECKSTART: start.CHECKSTART,
                SLEEPKIST_ID: start.SLEEPKIST_ID,
                SLEEP_HOOGTE: start.SLEEP_HOOGTE,

                OPMERKINGEN: start.OPMERKINGEN,
                EXTERNAL_ID: start.EXTERNAL_ID
            };
            if (start.ID) {
                this.formTitel = 'Start bewerken';
                this.haalStartOp(start.ID as number); // maar starts kan gewijzigd zijn, dus toch even starts ophalen van API
            }
            else
            {
                this.formTitel = `Start aanmaken`;
            }
        } else {
            this.formTitel = `Start aanmaken`;

            let veld_id = this.VliegveldID;
            let baan_id = undefined;
            let startmethode_id = undefined;

            if ((this.VliegveldID == this.daginfoService.dagInfo.VELD_ID) ||
                (this.VliegveldID == this.daginfoService.dagInfo.VELD_ID2)) {
                veld_id = (this.VliegveldID == this.daginfoService.dagInfo.VELD_ID2) ? this.daginfoService.dagInfo.VELD_ID2 : this.daginfoService.dagInfo.VELD_ID;
                baan_id = (this.VliegveldID == this.daginfoService.dagInfo.VELD_ID2) ? this.daginfoService.dagInfo.BAAN_ID2 : this.daginfoService.dagInfo.BAAN_ID;
                startmethode_id = (this.VliegveldID == this.daginfoService.dagInfo.VELD_ID2) ? this.daginfoService.dagInfo.STARTMETHODE_ID2 : this.daginfoService.dagInfo.STARTMETHODE_ID;
            }

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

                STARTMETHODE_ID: startmethode_id,
                VELD_ID: veld_id,
                BAAN_ID: baan_id,
                PAX: false,
                CHECKSTART: false,
                SLEEPKIST_ID: undefined,
                SLEEP_HOOGTE: undefined,

                OPMERKINGEN: undefined,
                EXTERNAL_ID: undefined
            };
        }
        // Zet de juiste parameters (doe alsof er invoer heeft plaatsgevonden), heeft invloed op het tonen van velden in de editor
        this.vliegtuigGeselecteerd(this.start.VLIEGTUIG_ID);
        this.vliegerGeselecteerd(this.start.VLIEGER_ID)

        this.isVerwijderMode = false;
        this.isRestoreMode = false;
        this.isSaving = false;
        this.toonGastCombobox = false;

        const ui = this.loginService.userInfo?.Userinfo;
        this.startDatum = DateTime.fromSQL(this.start.DATUM!);

        const nu:  DateTime = DateTime.now()
        const diff = Interval.fromDateTimes(this.startDatum, nu);
        this.magDatumAanpassen = ((Math.floor(diff.length("days")) <= this.configService.maxZelfEditDagen()) && (!ui?.isStarttoren) || ui!.isBeheerder! || ui!.isBeheerderDDWV!);

        this.popup.open();

        // open de lijst met vliegtuigen, bij aan,maken nieuwe start
        if (!start) {
            this.vliegtuigInvoerComponent.ngSelect.open();
        }
    }

    closePopup() {
        this.popup.close();
    }

    // Ophalen van de start uit de database (via API)
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

            // Als het vliegtuig een DBO trainer is, dan zetten we meteen dat het een instructievlucht is
            // Maar dat doen we alleen bij nieuwe invoer
            if ((this.gekozenVliegtuig.ZITPLAATSEN == 2) && (this.gekozenVliegtuig.TRAINER) && (this.start.ID == undefined)) {
                this.start.INSTRUCTIEVLUCHT = true;
            }

            // Voor eenzitters is het natuurlijk nooit een instructie start
            if (this.gekozenVliegtuig.ZITPLAATSEN == 1) {
                this.start.INSTRUCTIEVLUCHT = false;
            }
        }

        // Indien clubkist dan mogen er een aantal lidtypes hierop niet vliegen
        // 607 = zusterclub
        // 610 = oprotkabel
        // 613 = systeem gebruiker
        // 625 = DDWV'er
        this.exclLidtypeAlsVlieger = (this.gekozenVliegtuig?.CLUBKIST) ? "607,610,613,625" : "613";

        this.tonenInzittendeNaam();
    }

    // De vlieger is nu ingevoerd
    vliegerGeselecteerd(id: number | undefined) {
        this.start.VLIEGER_ID = id;
        const gekozenVlieger = this.leden.find(lid => lid.ID == id) as HeliosLedenDataset;

        if (!gekozenVlieger) {
            this.toonVliegerNaam = false;
        } else {
            switch (gekozenVlieger.LIDTYPE_ID) {
                case 609:   // nieuw lid
                {
                    this.toonVliegerNaam = true;
                    break;
                }
                case 607:   // zusterclub
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
        this.tonenInzittendeNaam();
        this.vliegtuigTypeBevoegd();
        this.medicalCheck();
    }

    // De inzittende is nu ook bekend
    inzittendeGeselecteerd($event: number |undefined ) {
        this.start.INZITTENDE_ID = $event;
        this.tonenInzittendeNaam();
        this.vliegtuigTypeBevoegd();

        this.medicalCheck();
    }

    //  this.toonInzittendeNaam: 0, naam hoeft niet ingevoerd te worden
    //  this.toonInzittendeNaam: 1, naam mag ingevoerd worden, maar ook inzittende combobox tonen
    //  this.toonInzittendeNaam: 2, toon alleen de naam invoer
    tonenInzittendeNaam() {
        if ((this.gekozenVliegtuig) && (this.gekozenVliegtuig.ZITPLAATSEN !== 2)) return false;  // voor eenzitters geen naam tonen
        const gekozenVlieger = this.leden.find(lid => lid.ID == this.start.VLIEGER_ID) as HeliosLedenDataset;
        const gekozenInzittende = this.leden.find(lid => lid.ID == this.start.INZITTENDE_ID) as HeliosLedenDataset;

        if (gekozenVlieger) {
            switch (gekozenVlieger.LIDTYPE_ID) {
                case 607:   // zusterclub
                case 610:   // oprotkabel
                case 612:   // penningmeester
                {
                    this.toonInzittendeNaam = 2;
                    return;
                }
                default :
                {
                    this.toonInzittendeNaam = 0;
                    break;
                }
            }
        }

        if (gekozenInzittende) {
            this.toonInzittendeNaam = (gekozenInzittende.LIDTYPE_ID == 609) ? 1 : 0; // 609 = nieuwlid
        }
        else {
            this.toonInzittendeNaam = 0;
        }
    }

    // toon popup om vlucht te verwijderen
    openVerwijderPopup(id: number) {
        this.haalStartOp(id);
        this.formTitel = 'Start verwijderen';

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    // toon popup om eerder verwijderde vlucht weer terug ui de prullenbak te halen
    openRestorePopup(id: number) {
        this.haalStartOp(id);
        this.formTitel = 'Start herstellen';

        this.isSaving = false;
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    // Opslaan van de informatie
    uitvoeren() {
        // extra vraag om instructie vlucht, indien nodig
        let doorgaan = true;

        if (this.gekozenVliegtuig.ZITPLAATSEN == 2 && !this.isVerwijderMode && !this.isRestoreMode) {
            const inzittende = this.leden.find(lid => lid.ID == this.start.INZITTENDE_ID) as HeliosLedenDataset;

            if (inzittende && inzittende.INSTRUCTEUR && !this.start.INSTRUCTIEVLUCHT) {
                doorgaan = confirm("Bevestig dat dit GEEN instructie vlucht is.");
            }
        }

        if (doorgaan) {
            this.isSaving = true;
            if (this.isRestoreMode) {
                this.Herstellen(this.start);
            }

            if (this.isVerwijderMode) {
                this.Verwijderen(this.start);
            }

            if (!this.isVerwijderMode && !this.isRestoreMode) {
                if (!this.toonVliegerNaam) {
                    this.start.VLIEGERNAAM = undefined;
                }
                if (this.toonInzittendeNaam == 0 && !this.start.PAX) {
                    this.start.INZITTENDENAAM = undefined;
                }

                if (this.start.ID) {
                    this.Aanpassen(this.start);
                } else {
                    this.Toevoegen(this.start);
                }
            }
        }
    }

    // nieuwe start is ingevoerd, nu opslaan
    Toevoegen(start: HeliosStart) {
        if (!this.toonVliegerNaam) {
            this.start.VLIEGERNAAM = undefined;
        }
        if (!this.toonInzittendeNaam) {
            this.start.INZITTENDENAAM = undefined;
        }
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
        if (!this.toonVliegerNaam) {
            this.start.VLIEGERNAAM = undefined;
        }
        if (!this.toonInzittendeNaam) {
            this.start.INZITTENDENAAM = undefined;
        }
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

    // check of medical op orde is. Check inzittende wanneer het een instructie vlucht is
    medicalCheck() {
        const checkID = this.start.INSTRUCTIEVLUCHT ? this.start.INZITTENDE_ID : this.start.VLIEGER_ID
        const gekozenVlieger = this.leden.find(lid => lid.ID == checkID) as HeliosLedenDataset;

        if (!gekozenVlieger) {
            this.medicalWaarschuwing = false;   // er is nog geen vlieger geselecteerd
        } else {
            switch (gekozenVlieger.LIDTYPE_ID) {
                case 609:   // nieuw lid
                case 607:   // zusterclub
                case 610:   // oprotkabel
                case 612:   // penningmeester
                {
                    this.medicalWaarschuwing = false;
                    break;
                }
                default: {
                    if (!gekozenVlieger.MEDICAL) {
                        this.medicalWaarschuwing = true;   // medical niet ingevoerd
                    }
                    else {
                        // is medical verlopen op de vliegdag?

                        const d = DateTime.fromSQL(gekozenVlieger.MEDICAL);
                        this.medicalWaarschuwing =  (d < this.datum);
                    }
                    break;
                }
            }
        }
    }

    // Mag het lid vliegen op het gekozen vliegtuig. Alleen van toepassing op clubkisten
    // Voor instructie vlucht, checken we de inzittende ipv vlieger
    vliegtuigTypeBevoegd() {
        // moeten natuurlijk vlieger en vliegtuig ingevoerd hebben
        if (!this.start.VLIEGTUIG_ID || !this.start.VLIEGER_ID) {
            this.toonWaarschuwing = false;
            return;
        }

        // alleen controle op clubvliegtuigen
        if (this.gekozenVliegtuig.CLUBKIST == false) {
            this.toonWaarschuwing = false;
            return;
        }
        const checkID = this.start.INSTRUCTIEVLUCHT ? this.start.INZITTENDE_ID : this.start.VLIEGER_ID
        const gekozenVlieger = this.leden.find(lid => lid.ID == checkID) as HeliosLedenDataset;

        if (gekozenVlieger) {
            switch (gekozenVlieger.LIDTYPE_ID) {
                case 609:   // nieuw lid
                case 607:   // zusterclub
                case 610:   // oprotkabel
                case 612:   // penningmeester
                {
                    this.toonWaarschuwing = false;
                    return;
                }
            }
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
            this.toonWaarschuwing = progressie.length <= 0;
        });
    }

    // mag de gebruiker de vlucht afvinken als trainingsvlucht
    magCheckZetten() {
        const ui = this.loginService.userInfo?.Userinfo;
        const magCheckZetten = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;

        if (magCheckZetten == false) {
            return false;
        }

        if (!this.start.INSTRUCTIEVLUCHT) {
            return false; // alleen een instructie vlucht kan afgetekend worden als trainingsvlucht
        }

        const gekozenVlieger = this.leden.find(lid => lid.ID == this.start.VLIEGER_ID) as HeliosLedenDataset;
        if (!gekozenVlieger) {
            return false;   // Vlieger moet bekend zijn
        } else {
            // Checkstart alleen mogelijk bij leden
            switch (gekozenVlieger.LIDTYPE_ID) {
                case 601:  break;  // Erelid
                case 602:  break;  // Lid
                case 603:  break;  // Jeugdlid
                default: {
                    return false;
                }
            }
        }

        // Trainingsvlucht is alleen van toepassing voor brevethouders
        if (gekozenVlieger.STATUSTYPE_ID !== 1903) {
            return false;
        }

        // De inzittende moet wel een instructeur zijn
        if (this.start.INZITTENDE_ID) {
            const inzittende = this.leden.find(lid => lid.ID == this.start.INZITTENDE_ID) as HeliosLedenDataset;

            if ((inzittende.INSTRUCTEUR == true) || (inzittende.CIMT == true)) {
                return true;
            }
        }
        return false;
    }

    // Kan de vlucht een instructie vlucht zijn? Instrcuteur moet dan achterin
    kanInstructieVluchtZijn() {
        const inzittende = this.leden.find(lid => lid.ID == this.start.INZITTENDE_ID) as HeliosLedenDataset;
        if (!inzittende) {
            return true;            // Inzittende is niet ingevoerd, laten we checkbox maar tonen
        }
        return inzittende.INSTRUCTEUR;  // Is inzittende een instructeur
    }

    // Is de start methode ingevoerd
    StartMethodeIngevuld(): string {
        if (this.start.STARTMETHODE_ID) {
            return ""
        }
        else {
            return "SMinvalid"
        }
    }

    // Er mag alleen opgeslagen worden als aan de minimale voorwaarden zijn voldaan
    opslaanDisabled() {
        if (!this.start.VLIEGTUIG_ID || !this.start.STARTMETHODE_ID || !this.start.VELD_ID) {
            return true;
        }

        if (this.toonVliegerNaam && !this.start.VLIEGERNAAM) {
            return true;
        }

        return false;
    }

    // Mag de vlieger pax vliegen? Staat in zijn profiel (dus niet in progressiekaart)
    magPaxVliegen() {
        const gekozenVlieger = this.leden.find(lid => lid.ID == this.start.VLIEGER_ID) as HeliosLedenDataset;
        if (!gekozenVlieger) {
            return true;            // Vlieger is niet ingevoerd, laten we checkbox maar tonen
        }
        return gekozenVlieger.PAX;  // Mag vlieger PAX vliegen
    }

    // Mogen de vlieger voorin / achterin omgewisseld worden?
    magOmwisselen() {
        if (this.gekozenVliegtuig?.ZITPLAATSEN !== 2)     return false;
        if (this.start.INSTRUCTIEVLUCHT == true)          return false;
        if (this.start.PAX == true)                       return false;

        return true;
    }

    // De knop omwissellen is gebruikt, dus nu vlieger en inzittende omwisselen. Soms alleen de ingevoerde namen, anders de ID's
    omwisselen() {
        let alleenNamenOmwisselen = false;

        const gekozenVlieger = this.leden.find(lid => lid.ID == this.start.VLIEGER_ID) as HeliosLedenDataset;
        if (gekozenVlieger) {
            switch (gekozenVlieger.LIDTYPE_ID) {
                case 607:   // zusterclub
                case 610:   // oprotkabel
                case 612:   // penningmeester
                {
                    alleenNamenOmwisselen = true;
                }
            }
        }

        // tijdelijke variablen
        const tmpID: number | undefined = this.start.VLIEGER_ID;
        const tmpNaam: string | undefined = this.start.VLIEGERNAAM;

        if (!alleenNamenOmwisselen) {
            this.vliegerGeselecteerd(this.start.INZITTENDE_ID);
            this.start.INZITTENDE_ID = tmpID;
        }

        this.start.VLIEGERNAAM = this.start.INZITTENDENAAM;
        this.start.INZITTENDENAAM = tmpNaam;
    }

    // Datum van de start aanpassen
    datumAanapssen($datum: NgbDate) {
        this.startDatum = DateTime.fromObject({year: $datum.year, month: $datum.month, day: $datum.day});
        this.start.DATUM = this.startDatum.toISODate();
    }
}
