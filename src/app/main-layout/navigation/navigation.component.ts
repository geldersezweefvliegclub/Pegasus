import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {beheerRoutes, CustomRoute, routes} from '../../routing.module';

import {Router} from '@angular/router';
import {
    faGaugeSimpleHigh,
    faSignOutAlt,
    faWrench
} from '@fortawesome/free-solid-svg-icons';
import {
    NgbCalendar,
    NgbDate,
    NgbDateParserFormatter, NgbDatepicker,
    NgbDatepickerNavigateEvent,
    NgbDateStruct
} from '@ng-bootstrap/ng-bootstrap';
import {SchermGrootte, SharedService} from '../../services/shared/shared.service';
import {DateTime} from 'luxon';

import {HeliosActie, KalenderMaand} from '../../types/Utils';
import {getBeginEindDatumVanMaand} from '../../utils/Utils';

import {LoginService} from '../../services/apiservice/login.service';
import {RoosterService} from "../../services/apiservice/rooster.service";
import {DienstenService} from "../../services/apiservice/diensten.service";
import {VliegtuigenService} from "../../services/apiservice/vliegtuigen.service";
import {StartlijstService} from '../../services/apiservice/startlijst.service';
import {DaginfoService} from '../../services/apiservice/daginfo.service';
import {Subscription} from "rxjs";
import {delay} from "rxjs/operators";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {PegasusConfigService} from "../../services/shared/pegasus-config.service";
import {PopupKalenderComponent} from "./popup-kalender/popup-kalender.component";
import {NgbDateFRParserFormatter} from "../../shared/ngb-date-fr-parser-formatter";

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class NavigationComponent implements OnInit, OnDestroy  {
    @Input() topMenu: boolean = false;
    @ViewChild(PopupKalenderComponent) popupKalender: PopupKalenderComponent;

    readonly routes = routes;
    readonly beheerRoutes = beheerRoutes;
    readonly logUitIcon: IconDefinition = faSignOutAlt;
    readonly beheerIcon: IconDefinition = faWrench;
    readonly rapportageIcon: IconDefinition = faGaugeSimpleHigh;


    kalenderMaand: KalenderMaand;
    startDatum: DateTime;
    eindDatum: DateTime;
    showBeheer: boolean = false;

    vandaag = this.calendar.getToday();
    datumDMY: string = this.vandaag.day + "-" + this.vandaag.month + "-" + this.vandaag.year;
    kalenderIngave: NgbDateStruct = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day};  // de gekozen dag

    kalenderEersteDatum: NgbDateStruct;
    kalenderLaatsteDatum: NgbDateStruct;

    vliegdagen: string = "";        // vliegdagen van deze maand in json formaat
    diensten: string = "";          // daginfos van deze maand in json formaat
    daginfo: string = "";           // daginfos van deze maand in json formaat

    beheerExcluded = false;

    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalende
    private dienstenAbonnement: Subscription;
    private dbEventAbonnement: Subscription;
    private vliegtuigenAbonnement: Subscription;
    private dagInfoAbonnement: Subscription;
    private userInfoAbonnement: Subscription;

    constructor(readonly loginService: LoginService,
                private readonly startlijstService: StartlijstService,
                private readonly daginfoService: DaginfoService,
                private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly sharedService: SharedService,
                private readonly configService: PegasusConfigService,
                private readonly router: Router,
                private readonly calendar: NgbCalendar) {
        const ui = this.loginService.userInfo?.Userinfo;

        // Starttoren mag geen datum kiezen, alleen vandaag
        if (ui?.isStarttoren) {
            this.kalenderEersteDatum = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day}
            this.kalenderLaatsteDatum = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day}
        } else {
            this.kalenderEersteDatum = {year: 2015, month: 1, day: 1}
            this.kalenderLaatsteDatum = {year: this.vandaag.year + 1, month: 12, day: 31}
        }
    }

    ngOnInit() {
        this.toonMenuItems();

        // Als daginfo of startlijst is aangepast, moet we kalender achtergrond ook updaten
        // Omdat dit minder belangrijk is dan andere API calls, een kleine vertraging
        this.dbEventAbonnement = this.sharedService.heliosEventFired.pipe(delay(500)).subscribe(ev => {
            if (ev.tabel == "Daginfo") {
                if (ev.actie == HeliosActie.Delete || ev.actie == HeliosActie.Restore) {

                    // bij verwijderen-restore, gaan we altijd dagen opvragen
                    this.daginfoService.getDagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.daginfo = JSON.stringify(dataset);
                    });
                } else if (!this.daginfo.includes(ev.data.DATUM)) {

                    // nieuwe daginfo ophalen als we deze dag nog niet hebben (include faalt)
                    this.daginfoService.getDagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.daginfo = JSON.stringify(dataset);
                    });
                }
            }

            if (ev.tabel == "Startlijst") {
                if (ev.actie == HeliosActie.Delete || ev.actie == HeliosActie.Restore) {

                    // bij verwijderen-restore, gaan we altijd dagen opvragen
                    this.startlijstService.getVliegdagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.vliegdagen = JSON.stringify(dataset);
                    });
                } else if (!this.vliegdagen.includes(ev.data.DATUM)) {

                    // nieuwe vliegdagen ophalen als we deze dag nog niet hebben (include faalt)
                    this.startlijstService.getVliegdagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.vliegdagen = JSON.stringify(dataset);
                    });
                }
            }
        });

        // abonneer op wijziging van kalender datum
        this.dagInfoAbonnement = this.daginfoService.dagInfoChange.subscribe(di => {
            const m = this.routes.find(route => route.path == "daginfo") as CustomRoute;
            const ui = this.loginService.userInfo?.Userinfo;

            // als we ingelogd zijn als starttoren en daginfo is niet gevuld, dan markering toevoegen
            if ((ui?.isStarttoren) && ((di.VELD_ID == undefined) || (di.STARTMETHODE_ID == undefined))) {
                m.batch = "<div class=\"fas fa-exclamation-triangle \"></div>";
            }
            else {
                m.batch = undefined;
            }
        });

        // abonneer op wijziging van diensten
        this.dienstenAbonnement = this.dienstenService.dienstenChange.subscribe(maandDiensten => {
            const ui = this.loginService.userInfo?.LidData;
            this.diensten = JSON.stringify(maandDiensten!.filter((dienst) => { return dienst.LID_ID  == ui!.ID}));
        });

        // abonneer op wijziging van vliegtuigen
        this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
            let nietInzetbaar = 0;

            vliegtuigen!.forEach(kist => {
                if ((!kist.INZETBAAR) && (kist.CLUBKIST)) nietInzetbaar++;
            });

            const v = this.routes.find(route => route.path == "vliegtuigen") as CustomRoute;
            v.batch = nietInzetbaar;
        });

        // abonneer op wijziging van profiel via userInfo
        this.userInfoAbonnement = this.loginService.userInfoChange.subscribe(userInfo => {
            this.toonMenuItems();
        })

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.kalenderIngave = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1,
                })
            }
        });

        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.kalenderIngave = datum;
            this.datumDMY = datum.day + "-" + datum.month + "-" + datum.year;
        });
    }

    ngOnDestroy(): void {
        if (this.dienstenAbonnement)    this.dienstenAbonnement.unsubscribe();
        if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
        if (this.dagInfoAbonnement)     this.dagInfoAbonnement.unsubscribe();
        if (this.userInfoAbonnement)    this.userInfoAbonnement.unsubscribe();
        if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement)       this.maandAbonnement.unsubscribe();
    }

    // welke menu items mogen getoond worden
    toonMenuItems() {
        const ui = this.loginService.userInfo?.Userinfo;
        const verbergen = this.configService.getVerborgenMenuItems();

        const tracks = this.routes.find(route => route.path == "tracks") as CustomRoute;
        tracks.excluded = true  // default, tracks is niet van toepassing voor de meeste leden
        if (ui?.isCIMT || ui?.isInstructeur || ui?.isBeheerder) {
            tracks.excluded = false;
        }

        const daginfo = this.routes.find(route => route.path == "daginfo") as CustomRoute;
        daginfo.excluded = true;    // default, daginfo is niet van toepassing voor de meeste leden

        // laten we dag info zien
        if (!verbergen.includes('daginfo')) {
            if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isInstructeur || ui?.isCIMT || ui?.isStarttoren || ui?.isDDWVCrew) {
                daginfo.excluded = false;
            }
        }

        // starttoren heeft geen dashboard
        const dashboard = this.routes.find(route => route.path == "dashboard") as CustomRoute;
        if (verbergen.includes('dashboard') || ui?.isStarttoren) {
            dashboard.excluded = true;
        } else {
            dashboard.excluded = false;
        }

        // alleen starttoren heeft een startlijst
        const startlijst = this.routes.find(route => route.path == "startlijst") as CustomRoute;
        if (verbergen.includes('startlijst') || (!ui?.isStarttoren && !ui?.isBeheerder)) {
            startlijst.excluded = true;
        } else {
            startlijst.excluded = false;
        }

        // alleen echte gebruiker hebben profiel, starttoren, zusterclubs, etc dus niet
        const profiel = this.routes.find(route => route.path == "profiel") as CustomRoute;
        profiel.excluded = false;
        if (verbergen.includes('profiel') || (!ui?.isDDWV && !ui?.isClubVlieger)) {
            profiel.excluded = true
        } else {
            // is profiel compleet ingevuld. Zo nee dan waarschuwing
            let showBatch = false;

            if (ui?.isClubVlieger) {
                const lData = this.loginService.userInfo?.LidData;

                if (lData!.AVATAR == null) {
                    showBatch = true;
                } else {
                    if (lData!.MEDICAL == null) {
                        showBatch = true;
                    } else {
                        const medicalVerloopt = DateTime.fromSQL(lData!.MEDICAL);

                        if (medicalVerloopt < DateTime.now()) {
                            showBatch = true;
                        }
                    }
                }
            }

            if (showBatch) {
                profiel.batch = "<div class=\"fas fa-exclamation-triangle \"></div>";
            } else {
                profiel.batch = undefined;
            }
        }

        // alleen echte gebruiker hebben toegang tot ledenlijst, starttoren, zusterclubs, etc dus niet
        const leden = this.routes.find(route => route.path == "leden") as CustomRoute;
        if (verbergen.includes('leden') || (!ui?.isDDWV && !ui?.isClubVlieger && !ui?.isStarttoren)) {
            leden.excluded = true;
        } else {
            leden.excluded = false;
        }

        // alleen echte gebruiker hebben toegang tot rooster, starttoren, zusterclubs, etc dus niet
        const rooster = this.routes.find(route => route.path == "rooster") as CustomRoute;
        if (verbergen.includes('rooster') || (!ui?.isDDWV && !ui?.isClubVlieger)) {
            rooster.excluded = true;
        } else {
            rooster.excluded = false;
        }

        // alleen clubvliegers en starttoren hebben toegnag tot reservering
        const reserveringen = this.routes.find(route => route.path == "reserveringen") as CustomRoute;
        if (verbergen.includes('reserveringen') || (!ui?.isClubVlieger && !ui?.isStarttoren)) {
            reserveringen.excluded = true;
        } else {
            reserveringen.excluded = false;
        }


        if (verbergen.includes('beheer') || (this.sharedService.getSchermSize() < SchermGrootte.lg) || (window.innerHeight < 600)) {
            this.beheerExcluded = true;
        } else {
            this.beheerExcluded = false;
        }

        const types = this.beheerRoutes.find(route => route.path == "types") as CustomRoute;
        types.excluded = !ui?.isBeheerder;

        const competenties = this.beheerRoutes.find(route => route.path == "competenties") as CustomRoute;
        competenties.excluded = !ui?.isBeheerder;

        const transacties = this.beheerRoutes.find(route => route.path == "transacties") as CustomRoute;
        transacties.excluded = !ui?.isBeheerder && !ui?.isBeheerderDDWV;

        // alleen beheer-rapportage in het menu als we voldoende scherm ter beschikking hebben
        const rapportage = this.beheerRoutes.find(route => route.path == "rapportage") as CustomRoute;
        if (verbergen.includes('rapportage') || (this.sharedService.getSchermSize() < SchermGrootte.lg) || (window.innerHeight < 600)) {
            rapportage.excluded = true;
        } else {
            rapportage.excluded = !(ui?.isBeheerder || ui?.isCIMT);
        }
    }


    // het is voorbij en we gaan terug naar de login pagina
    Uitloggen(): void {
        this.loginService.uitloggen();
        this.router.navigate(['/login']);
    }

    // laat iedereen weten dat er een nieuwe datum is gekozen
    NieuweDatum(datum: NgbDate) {
        this.sharedService.zetKalenderDatum(datum);
        this.kalenderIngave = datum;

        this.datumDMY = datum.day + "-" + datum.month + "-" + datum.year;
    }

    // de kalender popup toont andere maand, ophalen vliegdagen
    KalenderAndereMaand($event: NgbDatepickerNavigateEvent) {
        this.kalenderMaand = $event.next;

        // laat iedereen weten dat we een ander maand-jaar hebben
        // niet nodig bij initialiseren. current is dan niet gevuld. We weten wel dat we 'vandaag' als init datum hebben
        if ($event.current) {
            this.sharedService.zetKalenderMaand(this.kalenderMaand);
        }

        const beginEindData = getBeginEindDatumVanMaand(this.kalenderMaand.month, this.kalenderMaand.year)
        this.startDatum = beginEindData.begindatum
        this.eindDatum = beginEindData.einddatum;

        this.startlijstService.getVliegdagen(this.startDatum, this.eindDatum).then((dataset) => {
            this.vliegdagen = JSON.stringify(dataset);
        });

        this.daginfoService.getDagen(this.startDatum, this.eindDatum).then((dataset) => {
            this.daginfo = JSON.stringify(dataset);
        });

        const ui = this.loginService.userInfo?.LidData;
        this.dienstenService.getDiensten(this.startDatum, this.eindDatum, undefined, ui?.ID).then((dataset) => {
            this.diensten = JSON.stringify(dataset);
        });
    }

    // highlight de dag als er starts zijn geweest
    cssCustomDay(date: NgbDate): string {
        const datum: DateTime = DateTime.fromObject({year: date.year, month: date.month, day: date.day})

        let classes = "";
        if (this.vliegdagen.includes(datum.toISODate())) {
            classes += " vliegdag";
        }

        if (this.daginfo.includes(datum.toISODate())) {
            classes += " daginfo";
        }

        if (this.diensten.includes('"DATUM":"' + datum.toISODate())) {
            classes += " diensten";
        }

        const d = DateTime.fromObject({
            year: this.kalenderIngave.year,
            month: this.kalenderIngave.month,
            day: this.kalenderIngave.day
        });
        if (datum.toISODate() == d.toISODate()) {
            classes += " gekozenDatum";
        }

        return classes;
    }

    toonLogo() {
        return (((window.innerHeight > 800) && (!this.showBeheer)) || (window.innerHeight > 900))
    }

    kleineDatum() {
        return (window.innerHeight < 700 || this.sharedService.getSchermSize() < SchermGrootte.xxl)
    }
}
