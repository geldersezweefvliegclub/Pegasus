import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faPen, faPenToSquare, faSortAmountDownAlt} from "@fortawesome/free-solid-svg-icons";
import {Observable, of, Subscription} from "rxjs";
import {
    HeliosAanwezigLedenDataset,
    HeliosAanwezigVliegtuigenDataset,
    HeliosBehaaldeProgressieDataset,
    HeliosLedenDataset,
    HeliosStart,
    HeliosStartDataset,
    HeliosType,
    HeliosVliegtuigenDataset
} from "../../../types/Helios";
import {DateTime, Interval} from "luxon";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {LoginService} from "../../../services/apiservice/login.service";
import {SharedService} from "../../../services/shared/shared.service";
import {AanwezigVliegtuigService} from "../../../services/apiservice/aanwezig-vliegtuig.service";
import {AanwezigLedenService} from "../../../services/apiservice/aanwezig-leden.service";
import {
    AanmeldenVliegtuigComponent
} from "../../../shared/components/aanmelden-vliegtuig/aanmelden-vliegtuig.component";
import {AanmeldenLedenComponent} from "../../../shared/components/aanmelden-leden/aanmelden-leden.component";
import {
    LidAanwezigEditorComponent
} from "../../../shared/components/editors/lid-aanwezig-editor/lid-aanwezig-editor.component";
import {ErrorMessage, KeyValueArray, SuccessMessage} from "../../../types/Utils";
import {TijdInvoerComponent} from "../../../shared/components/editors/tijd-invoer/tijd-invoer.component";
import {StartEditorComponent} from "../../../shared/components/editors/start-editor/start-editor.component";
import {DaginfoService} from "../../../services/apiservice/daginfo.service";
import {CdkDrag, CdkDragDrop} from "@angular/cdk/drag-drop";
import {VliegtuigenService} from "../../../services/apiservice/vliegtuigen.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {TypesService} from "../../../services/apiservice/types.service";
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";

type HeliosStartDatasetExtended = HeliosStartDataset & {
    ZITPLAATSEN?: number,
    MEDICAL?: boolean
    BEVOEGD?: boolean;
}

@Component({
    selector: 'app-startlijst-page',
    templateUrl: './startlijst-page.component.html',
    styleUrls: ['./startlijst-page.component.scss']
})
export class StartlijstPageComponent implements OnInit, OnDestroy {
    @ViewChild(AanmeldenVliegtuigComponent) aanmeldSchermVliegtuigen: AanmeldenVliegtuigComponent;
    @ViewChild(AanmeldenLedenComponent) aanmeldSchermLeden: AanmeldenLedenComponent;
    @ViewChild(LidAanwezigEditorComponent) aanmeldEditor: LidAanwezigEditorComponent;
    @ViewChild(TijdInvoerComponent) tijdInvoerEditor: TijdInvoerComponent;
    @ViewChild(StartEditorComponent) startEditor: StartEditorComponent;

    readonly iconEdit: IconDefinition = faPenToSquare;
    readonly startlijstIcon: IconDefinition = faPen;
    readonly iconSort: IconDefinition = faSortAmountDownAlt;

    starts: HeliosStartDataset[] = [];
    filteredStarts: HeliosStartDatasetExtended[] = [];
    geselecteerdeStart: HeliosStartDataset | undefined;

    SchermGrootte = require("../../../services/shared/shared.service").SchermGrootte;

    isStarttoren: boolean = false;
    isLoading: boolean = false;
    filterAan: boolean = true;

    private dbEventAbonnement: Subscription;
    private aanwezigLedenAbonnement: Subscription;
    aanwezigLeden: HeliosAanwezigLedenDataset[] = [];
    filteredAanwezigLeden: HeliosAanwezigLedenDataset[] = [];

    private vliegtuigenAbonnement: Subscription;
    clubVliegtuigen: HeliosVliegtuigenDataset[] = [];
    private aanwezigVliegtuigenAbonnement: Subscription;
    aanwezigVliegtuigen: HeliosAanwezigVliegtuigenDataset[] = [];
    filteredAanwezigVliegtuigen: HeliosAanwezigVliegtuigenDataset[] = [];

    private resizeSubscription: Subscription; // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private datumAbonnement: Subscription;    // volg de keuze van de kalender
    datum: DateTime = DateTime.now();         // de gekozen dag in de kalender

    inTijdspan: boolean = false;          //  Mogen we starts aanpassen. Mag niet in de toekomst en ook niet meer dan xx dagen geleden.  xx is geconfigureerd in pegasus.config

    refreshTimer: number;
    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    klikStart: HeliosStartDataset | undefined;
    eersteKlik: boolean = false;

    private typesAbonnement: Subscription;              // Abonneer op aanpassing van vliegvelden
    veldTypes$: Observable<HeliosType[]>;
    vliegveld: number | undefined;                      // laat vluchten van een speciek vliegveld zien

    competentiesNodig: string;    // competenties die nodig zijn om op clubvliegtuigen te vliegen
    progressieCache: HeliosBehaaldeProgressieDataset[] = [];

    constructor(private readonly startlijstService: StartlijstService,
                private readonly aanwezigVliegtuigenService: AanwezigVliegtuigService,
                private readonly aanwezigLedenService: AanwezigLedenService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly progressieService: ProgressieService,
                private readonly configService: PegasusConfigService,
                private readonly daginfoService: DaginfoService,
                private readonly typesService: TypesService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
            this.starts = [];

            const ui = this.loginService.userInfo?.Userinfo;
            this.isStarttoren = ui!.isStarttoren as boolean;

            const nu:  DateTime = DateTime.now()
            if (datum.year * 10000 + datum.month * 100 + datum.day > nu.year * 10000 + nu.month * 100 + nu.day) {
                this.inTijdspan = false;    // datum is in de toekomst
            } else {
                const diff = Interval.fromDateTimes(datum, nu);
                if (diff.length("days") > this.configService.maxZelfEditDagen()) {
                    this.inTijdspan = ui?.isBeheerder!;     // alleen beheerder mag na xx dagen wijzigen. xx is geconfigureerd in pegasus.config
                } else {
                    this.inTijdspan = true;                 // zitten nog binnen de termijn
                }
            }
        });

        // abonneer op wijziging van vliegtuigen
        this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
            this.clubVliegtuigen = (vliegtuigen) ? vliegtuigen.filter((v) => v.CLUBKIST) : [];

            this.competentiesNodig = "";
            this.clubVliegtuigen.forEach((cv) => {
                if (cv.BEVOEGDHEID_LOKAAL_ID) {
                    this.competentiesNodig += (this.competentiesNodig == '') ? cv.BEVOEGDHEID_LOKAAL_ID : ',' + cv.BEVOEGDHEID_LOKAAL_ID;
                }
                if (cv.BEVOEGDHEID_OVERLAND_ID) {
                    this.competentiesNodig += (this.competentiesNodig == '') ? cv.BEVOEGDHEID_OVERLAND_ID : ',' + cv.BEVOEGDHEID_OVERLAND_ID;
                }
            })
        });

        // abonneer op wijziging van aanwezige leden
        this.aanwezigLedenAbonnement = this.aanwezigLedenService.aanwezigChange.subscribe(dataset => {
            this.aanwezigLeden = JSON.parse(JSON.stringify(dataset!));                // maak een copy
            this.filter(this.filterAan);
        });

        // abonneer op wijziging van aanwezige vliegtuigen
        this.aanwezigVliegtuigenAbonnement = this.aanwezigVliegtuigenService.aanwezigChange.subscribe(dataset => {
            // Als er starts is, even in juiste formaat zetten. Aanwezig moet hetzelfde formaat hebben als vliegtuigen
            this.aanwezigVliegtuigen = JSON.parse(JSON.stringify(dataset!)); // maak een copy
            this.filter(this.filterAan);
        });

        // Als startlijst is aangepast, moeten we grid opnieuw laden
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Startlijst") {
                this.opvragen();
            }
        });

        // abonneer op wijziging van types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.veldTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 9}));            // vliegvelden
        });

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize()
        });

        this.opvragen();
        this.onWindowResize();
    }

    ngOnDestroy(): void {
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
        if (this.dbEventAbonnement) this.dbEventAbonnement.unsubscribe();
        if (this.vliegtuigenAbonnement) this.vliegtuigenAbonnement.unsubscribe();
        if (this.aanwezigLedenAbonnement) this.aanwezigLedenAbonnement.unsubscribe();
        if (this.aanwezigVliegtuigenAbonnement) this.aanwezigVliegtuigenAbonnement.unsubscribe();

        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();

        clearTimeout(this.refreshTimer);
    }

    // Op large schermen tonen we de avatar
    onWindowResize() {

    }

    opvragen() {
        this.aanwezigVliegtuigenService.updateAanwezigCache();
        this.aanwezigLedenService.updateAanwezigCache();

        let queryParams: KeyValueArray = {};
        queryParams["OPEN_STARTS"] = "true"

        this.isLoading = true;
        this.startlijstService.getStarts(false, this.datum, this.datum, undefined, queryParams).then((dataset) => {
            this.starts = (dataset) ? dataset : [];

            // VLIEGT krijgen we uit de aanwezig, maar niet altijd. Heeft the maken dat VLIEGT geen invloed heeft op hash. Dus doen we het maar hier
            this.starts.forEach(vlucht => {
                if (vlucht.STARTTIJD && !vlucht.LANDINGSTIJD) {

                    // vliegtuig
                    const idxV = this.aanwezigVliegtuigen.findIndex(v => v.VLIEGTUIG_ID == vlucht.VLIEGTUIG_ID);
                    if (idxV >= 0) {
                        this.aanwezigVliegtuigen[idxV].VLIEGT = true;
                    }

                    // leden
                    const idxL = this.aanwezigLeden.findIndex(l => l.LID_ID == vlucht.VLIEGER_ID);
                    if (idxL >= 0) {
                        this.aanwezigLeden[idxL].VLIEGT = true;
                    }

                    // leden
                    const idxI = this.aanwezigLeden.findIndex(l => l.LID_ID == vlucht.INZITTENDE_ID);
                    if (idxI >= 0) {
                        this.aanwezigLeden[idxI].VLIEGT = true;
                    }
                }
            });
            this.filter(this.filterAan);

            this.isLoading = false;
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });

        clearTimeout(this.refreshTimer);
        this.refreshTimer = window.setTimeout(() => this.opvragen(), 1000 * 60 * 5);  // iedere 5 minuten
    }

    filter(aan: boolean) {
        this.filterAan = aan;

        // eerst filteren op vliegveld
        let starts = this.starts;
        let aanwezigLeden = this.aanwezigLeden
        let aanwezigVliegtuigen = this.aanwezigVliegtuigen;

        if (this.vliegveld) {
            starts = this.starts.filter((s:HeliosStartDatasetExtended) => { return ((s.VELD_ID == this.vliegveld) || (s.VELD_ID == undefined))})
            aanwezigLeden = this.aanwezigLeden.filter((s:HeliosAanwezigLedenDataset) => { return ((s.VELD_ID == this.vliegveld) || (s.VELD_ID == undefined))})
            aanwezigVliegtuigen = this.aanwezigVliegtuigen.filter((s:HeliosAanwezigVliegtuigenDataset) => { return ((s.VELD_ID == this.vliegveld) || (s.VELD_ID == undefined))})
        }

        if (!this.filterAan) {   // filter staat uit
            this.filteredStarts = starts;
            this.startExtendedVelden();
            this.filteredAanwezigLeden = aanwezigLeden.filter((a) => { return !a.VERTREK});  // als je naar huis bent, sta je niet meer in lijst
            this.filteredAanwezigVliegtuigen = aanwezigVliegtuigen;
        } else {  // filter op de 3 datasets  Leden, Vliegtuigen & Starts
            this.filteredStarts = starts.filter((s: HeliosStartDataset) => {
                return s.STARTTIJD == null
            });
            this.startExtendedVelden();
            this.filteredAanwezigVliegtuigen = aanwezigVliegtuigen.filter((a: HeliosAanwezigVliegtuigenDataset) => {
                return !a.VERTREK && a.VLIEGT == false
            });
            this.filteredAanwezigLeden = aanwezigLeden.filter((a: HeliosAanwezigLedenDataset) => {
                if (a.VERTREK) {
                    return false;
                }
                if (a.VLIEGT == true) {
                    return false;
                }

                if (this.geselecteerdeStart) {
                    if (this.geselecteerdeStart.INSTRUCTIEVLUCHT && a.INSTRUCTEUR) {  // bij een instructie vlucht, komen alle aanwezige instructeurs in aanmerking
                        return true;
                    }

                    if (this.geselecteerdeStart.VLIEGTUIGTYPE) {
                        if (a.VOORKEUR_VLIEGTUIG_TYPE?.includes(this.geselecteerdeStart.VLIEGTUIG_TYPE_ID!.toString())) {
                            return true;
                        }
                    }
                    if (this.geselecteerdeStart.VLIEGTUIG_ID) {
                        return (a.OVERLAND_VLIEGTUIG_ID == this.geselecteerdeStart.VLIEGTUIG_ID);
                    }
                }
                return true;
            });
        }

        // Zorg dat de lijst met aanwezige leden op de juiste manier gesorteeerd is
        this.filteredAanwezigLeden.sort(function compareFn(a, b) {
            // met de meeste starts sta je onderaan
            if ((a.STARTS! - b.STARTS!) != 0) {
                return a.STARTS! - b.STARTS!
            }

            // sorteer op je startlijst positie, heb je geen positie, dan sta je achteraan
            const posA = (a.POSITIE) ? a.POSITIE : 10000;
            const posB = (b.POSITIE) ? b.POSITIE : 10000;

            if ((posA - posB) != 0) {
                return posA - posB;
            }

            // Voor iedereen daarna, op basis van je aankomsttijd, heb je geen tijd, dan sta je achteraan
            // De aankomst tijd is hh:mm, de : wordt vervangen door 0 en dan een integer, zo kun je vergelijken
            // De maximale waarde is 23:59 = 23059
            const tijdA = parseInt((a.AANKOMST ? a.AANKOMST.replace(":", "0") : 24000) as string);
            const tijdB = parseInt((b.AANKOMST ? b.AANKOMST.replace(":", "0") : 24000) as string);

            if ((tijdA - tijdB) != 0) {
                return tijdA - tijdB;
            }

            return 0;     // TODO op basis van de vooraanmelding
        });

        this.filteredStarts.sort(function compareFn(a, b) {
            const tijdA = parseInt((a.DUUR ? a.DUUR.replace(":", "0") : 24000) as string);
            const tijdB = parseInt((b.DUUR ? b.DUUR.replace(":", "0") : 24000) as string);

            if ((tijdA - tijdB) != 0) {
                return tijdB - tijdA;
            }

            // sorteer op je startlijst positie, heb je geen positie, dan sta je achteraan
            const dnA = (a.DAGNUMMER) ? a.DAGNUMMER : 10000;
            const dnB = (b.DAGNUMMER) ? b.DAGNUMMER : 10000;

            return dnA - dnB;
        });
    }

    // Voeg aan de extra velden toe
    async startExtendedVelden() {
        for (let i = 0; i < this.filteredStarts.length; i++) {
            const idxV = this.aanwezigVliegtuigen.findIndex(v => v.VLIEGTUIG_ID == this.filteredStarts[i].VLIEGTUIG_ID);

            if (idxV < 0) {
                this.filteredStarts[i].ZITPLAATSEN = 0
            } else {
                this.filteredStarts[i].ZITPLAATSEN = this.aanwezigVliegtuigen[idxV].ZITPLAATSEN;
            }

            const checkID = this.filteredStarts[i].INSTRUCTIEVLUCHT ? this.filteredStarts[i].INZITTENDE_ID : this.filteredStarts[i].VLIEGER_ID;

            if (!checkID) {  // er is nog geen vlieger / instructeur bekend
                this.filteredStarts[i].MEDICAL = true;
                this.filteredStarts[i].BEVOEGD = true;
            } else {
                const gekozenVlieger = this.aanwezigLeden.find(lid => lid.LID_ID == checkID) as HeliosAanwezigLedenDataset;

                if (!gekozenVlieger) { // er is nog geen vlieger geselecteerd
                    this.filteredStarts[i].MEDICAL = true;
                    this.filteredStarts[i].BEVOEGD = true;
                } else {
                    switch (gekozenVlieger.LIDTYPE_ID) {
                        case 609:   // nieuw lid
                        case 607:   // zusterclub
                        case 610:   // oprotkabel
                        case 612:   // penningmeester
                        {
                            this.filteredStarts[i].MEDICAL = true;
                            break;
                        }
                        default: {
                            if (!gekozenVlieger.MEDICAL) {
                                this.filteredStarts[i].MEDICAL = false;   // medical niet ingevoerd
                            } else {
                                // is medical verlopen op de vliegdag?

                                const d = DateTime.fromSQL(gekozenVlieger.MEDICAL);
                                this.filteredStarts[i].MEDICAL = (d >= this.datum);
                            }
                            break;
                        }
                    }
                }

                if (!this.filteredStarts[i].CLUBKIST) {
                    this.filteredStarts[i].BEVOEGD = true;    // op een prive vliegtuig doen we geen controle
                } else {
                    // kijk of er al iets de cache staat voor deze vlieger
                    const idxP = this.progressieCache.findIndex(p => p.LID_ID == checkID);

                    if (idxP < 0) { // nee, we gaan ophalen
                        try {
                            const p: HeliosBehaaldeProgressieDataset[] = await this.progressieService.getProgressiesLid(checkID, this.competentiesNodig);

                            if (p.length == 0) {  // er zijn behaald competenties
                                this.progressieCache.push({LID_ID: checkID});     // stop dummy item in cache. Voorkomt nog meer opvragen
                            } else {
                                this.progressieCache = this.progressieCache.concat(p);                   // voeg opgehaalde competenties toe aan cache
                            }
                        } catch (e) {
                            this.filteredStarts[i].BEVOEGD = true;    // ophalen is mislukt, geen controle mogelijk
                            this.error = e;
                        }
                    }

                    // Gaan nu kijken of de bevoegdheid aanwezig is
                    const vliegtuig = this.clubVliegtuigen.find((v) => v.ID == this.filteredStarts[i].VLIEGTUIG_ID)

                    if (!vliegtuig) { // dit zo niet mogen geberen, maar als het gebeurd dan controleren we niet verder
                        this.filteredStarts[i].BEVOEGD = true;
                    } else {
                        if (!vliegtuig.BEVOEGDHEID_OVERLAND_ID && !vliegtuig.BEVOEGDHEID_LOKAAL_ID) { // voor dit vliegtuig is geen competentie nodig
                            this.filteredStarts[i].BEVOEGD = true;
                        } else {
                            const progressie = this.progressieCache.find((p) =>
                                p.LID_ID == checkID &&
                                (p.COMPETENTIE_ID == vliegtuig.BEVOEGDHEID_LOKAAL_ID || p.COMPETENTIE_ID == vliegtuig.BEVOEGDHEID_OVERLAND_ID));

                            this.filteredStarts[i].BEVOEGD = !!(progressie);
                        }
                    }
                }
            }
        }
    }

    // De start is aangeklikt. 1x klikken is selecteer of deselecteer start, 2x klikken is openen van de editor
    // Dat moeten we zelf detecteren. DblClick werkt niet uit de html template
    startKlik(start: HeliosStartDataset) {
        this.klikStart = start;

        if (this.eersteKlik) {
            this.eersteKlik = false;
            this.startEditor.openPopup(start);
        } else {
            this.eersteKlik = true;
            // als we binnen 250 msec niet nog een keer geklikt is, dan is het een enkele klik geweest
            setTimeout(() => {
                if (this.eersteKlik) {
                    this.selecteerStart(this.klikStart!)
                    this.eersteKlik = false;
                }
            }, 250);
        }
    }

    // openen van popup om bestaande start te kunnen aanpassen
    openStartEditor(start: HeliosStartDataset) {
        if (this.inTijdspan) {
            this.startEditor.openPopup(start);
        }
    }

    // selecteer een start uit de startlijst, of haal de selectie weg als je nog een keer klikt op de start
    selecteerStart(start: HeliosStartDataset) {
        if (!this.geselecteerdeStart) {
            this.geselecteerdeStart = start;
        } else {
            if (this.geselecteerdeStart.ID == start.ID) {
                this.geselecteerdeStart = undefined;
            } else {
                this.geselecteerdeStart = start;
            }
        }

        this.filter(this.filterAan); // ook meteen filter toepassen
    }

    // gaat hoger op de startlijst = eerder starten
    omhoog() {
        const idx = this.starts.findIndex(s => s.ID == this.geselecteerdeStart!.ID);

        if (idx > 0) {
            this.starts[idx].DAGNUMMER = this.starts[idx].DAGNUMMER! - 1;
            this.starts[idx - 1].DAGNUMMER = this.starts[idx - 1].DAGNUMMER! + 1;

            this.startlijstService.updateStart({ID: this.starts[idx].ID, DAGNUMMER: this.starts[idx].DAGNUMMER});
            this.startlijstService.updateStart({ID: this.starts[idx - 1].ID, DAGNUMMER: this.starts[idx - 1].DAGNUMMER});
        }
    }

    // gaat later starten
    omlaag() {
        const idx = this.starts.findIndex(s => s.ID == this.geselecteerdeStart!.ID);

        if ((idx >= 0) && (idx < this.starts.length - 1)) {
            this.starts[idx].DAGNUMMER = this.starts[idx].DAGNUMMER! + 1;
            this.starts[idx + 1].DAGNUMMER = this.starts[idx + 1].DAGNUMMER! - 1;

            this.startlijstService.updateStart({ID: this.starts[idx].ID, DAGNUMMER: this.starts[idx].DAGNUMMER});
            this.startlijstService.updateStart({ID: this.starts[idx + 1].ID, DAGNUMMER: this.starts[idx + 1].DAGNUMMER});
        }
    }

    // maak een nieuwe lege start aan, vul velden met default waarden uit daginfo
    nieuweStart(vliegtuigID: number) {
        const idx = this.aanwezigVliegtuigen.findIndex(v => v.VLIEGTUIG_ID == vliegtuigID);

        // aanmelden op een vliegveld. Via filter of daginfo
        let vliegveld = this.vliegveld;
        let baan = undefined;
        if (!vliegveld) {
            baan = this.daginfoService.dagInfo.BAAN_ID
            vliegveld = this.daginfoService.dagInfo.VELD_ID
        }

        const start: HeliosStart = {
            ID: undefined,
            DATUM: this.datum.toISODate() as string,
            DAGNUMMER: undefined,
            VLIEGTUIG_ID: vliegtuigID,
            VLIEGER_ID: undefined,
            INZITTENDE_ID: undefined,
            VLIEGERNAAM: undefined,
            INZITTENDENAAM: undefined,
            STARTTIJD: undefined,
            LANDINGSTIJD: undefined,
            INSTRUCTIEVLUCHT: this.aanwezigVliegtuigen[idx].TRAINER,

            STARTMETHODE_ID: this.daginfoService.dagInfo.STARTMETHODE_ID,
            VELD_ID: vliegveld,
            BAAN_ID: baan,
            PAX: false,
            CHECKSTART: false,
            SLEEPKIST_ID: undefined,
            SLEEP_HOOGTE: undefined,

            OPMERKINGEN: undefined,
            EXTERNAL_ID: undefined
        };

        this.startlijstService.addStart(start);
    }

    // mag de vlieger toegekend worden aan de start
    // als start geselecteerd is, dan niet drop op andere starts
    evaluatieVlieger(start: HeliosStartDataset, item: CdkDrag<HeliosAanwezigLedenDataset>): boolean {
        if (start.VLIEGER_ID == item.data.LID_ID) {
            return false;
        }
        return (!this.geselecteerdeStart) ? true : (start.ID == this.geselecteerdeStart.ID);
    }

    // mag de vlieger toegekend worden aan de start
    // als start geselecteerd is, dan niet drop op andere starts
    evaluatieInzittende(start: HeliosStartDataset, item: CdkDrag<HeliosAanwezigLedenDataset>): boolean {
        if (start.INZITTENDE_ID == item.data.LID_ID) {
            return false;
        }
        // alleen een instructeur kan achterin zitten bij een instructie vlucht
        if (start.INSTRUCTIEVLUCHT && !item.data.INSTRUCTEUR) {
            return false;
        }
        return (!this.geselecteerdeStart) ? true : (start.ID == this.geselecteerdeStart.ID);
    }

    // vanuit de leden aanwezig wordt er een vlieger / inzittende toegekend aan de start
    onDropInStart(event: CdkDragDrop<HeliosLedenDataset, any>, start: HeliosStartDataset, stoel: string) {
        if (stoel == "vlieger") {
            const update: HeliosStart = {
                ID: start.ID,
                VLIEGER_ID: event.item.data.LID_ID,
                VLIEGERNAAM: undefined
            }
            this.startlijstService.updateStart(update).then(() => this.opvragen());
        } else {
            const update: HeliosStart = {
                ID: start.ID,
                INZITTENDE_ID: event.item.data.LID_ID,
                INZITTENDENAAM: undefined
            }
            this.startlijstService.updateStart(update).then(() => this.opvragen());
        }
    }

    // open window om starttijd in te voeren
    startTijdClicked(start: HeliosStartDataset) {
        this.geselecteerdeStart = undefined;
        this.tijdInvoerEditor.openStarttijdPopup(start);
    }

    // open popup voor landingstijd invoer
    landingsTijdClicked(start: HeliosStartDataset) {
        this.geselecteerdeStart = undefined;
        this.tijdInvoerEditor.openLandingsTijdPopup(start);
    }

    // openen van aanmeld venster voor vliegtuigen
    aanmeldenVliegtuig() {
        this.aanmeldSchermVliegtuigen.openPopup();
    }

    // openen van windows voor aanmelden vlieger
    aanmeldenVliegers() {
        this.aanmeldSchermLeden.openPopup();
    }

    // open van editor voor aanmelden
    openLidAanwezigEditor(lidAanwzig: HeliosAanwezigLedenDataset) {
        if (this.inTijdspan) {
            this.aanmeldEditor.openPopup(lidAanwzig);
        }
    }
}
