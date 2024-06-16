import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {beheerRoutes, CustomRoute, routes} from '../../../routing.module';

import {Router} from '@angular/router';
import {
    faGaugeSimpleHigh, fas,
    faSignOutAlt,
    faWrench
} from '@fortawesome/free-solid-svg-icons';
import {
    NgbCalendar,
    NgbDate,
    NgbDateParserFormatter,
    NgbDateStruct
} from '@ng-bootstrap/ng-bootstrap';

import {DateTime} from 'luxon';

import {LoginService} from '../../../services/apiservice/login.service';
import {VliegtuigenService} from "../../../services/apiservice/vliegtuigen.service";
import {DaginfoService} from '../../../services/apiservice/daginfo.service';
import {Subscription} from "rxjs";
import {far, IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {SchermGrootte, SharedService} from '../../../services/shared/shared.service';
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {PopupKalenderComponent} from "../popup-kalender/popup-kalender.component";
import {NgbDateFRParserFormatter} from "../../../shared/ngb-date-fr-parser-formatter";

@Component({
    selector: 'app-navigatie',
    templateUrl: './navigatie.component.html',
    styleUrls: ['./navigatie.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})

export class NavigatieComponent implements OnInit, OnDestroy {
    @Input() hoofdscherm: boolean = false;
    @ViewChild(PopupKalenderComponent) popupKalender: PopupKalenderComponent;

    readonly routes = routes;
    readonly beheerRoutes = beheerRoutes;
    readonly logUitIcon: IconDefinition = faSignOutAlt;
    readonly beheerIcon: IconDefinition = faWrench;

    urlMenuItems:any[];
    showBeheer: boolean = false;

    vandaag = this.calendar.getToday();
    datumDMY: string = this.vandaag.day + "-" + this.vandaag.month + "-" + this.vandaag.year;
    kalenderIngave: NgbDateStruct = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day};  // de gekozen dag

    beheerExcluded = false;

    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    private dagInfoAbonnement: Subscription;
    private vliegtuigenAbonnement: Subscription;
    private userInfoAbonnement: Subscription;
    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)

    readonly activeRouteFilter = {excluded: false};

    constructor(readonly loginService: LoginService,
                private readonly router: Router,
                private readonly calendar: NgbCalendar,
                private readonly daginfoService: DaginfoService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly sharedService: SharedService,
                private readonly configService: PegasusConfigService) {
    }

    ngOnInit() {
        this.toonMenuItems();
        this.urlMenuItems = this.configService.menuItems()

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

        // abonneer op wijziging van kalender datum
        this.dagInfoAbonnement = this.daginfoService.dagInfoChange.subscribe(di => {
            const m = this.routes.find(route => route.path == "daginfo") as CustomRoute;
            const ui = this.loginService.userInfo?.Userinfo;

            // als we ingelogd zijn als starttoren en daginfo is niet gevuld, dan markering toevoegen
            if ((ui?.isStarttoren) && ((di.VELD_ID == undefined) || (di.STARTMETHODE_ID == undefined))) {
                m.batch = "<div class=\"fas fa-exclamation-triangle \"></div>";
            } else {
                m.batch = undefined;
            }
        });

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

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize()
        });
        this.onWindowResize();
    }

    ngOnDestroy(): void {
        if (this.userInfoAbonnement) this.userInfoAbonnement.unsubscribe();
        if (this.dagInfoAbonnement) this.dagInfoAbonnement.unsubscribe();
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    // als scherm dimensie aangepast worden, kunnen we meer/minder menu items tonen
    onWindowResize() {
        this.toonMenuItems()
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

        // DDWV'ers hebben geen toegang to vliegtuigen
        const vliegtuigen = this.routes.find(route => route.path == "vliegtuigen") as CustomRoute;
        if (verbergen.includes('vliegtuigen') || (ui?.isDDWV)) {
            vliegtuigen.excluded = true;
        } else {
            vliegtuigen.excluded = false;
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

        // document voor clubvliegers
        const documenten = this.routes.find(route => route.path == "documenten") as CustomRoute;
        if (verbergen.includes('documenten') || (!ui?.isClubVlieger && !ui?.isStarttoren)) {
            documenten.excluded = true;
        } else {
            documenten.excluded = false;
        }

        // meldingen voor clubvliegers
        const meldingen = this.routes.find(route => route.path == "meldingen") as CustomRoute;
        if (verbergen.includes('meldingen') || (!ui?.isClubVlieger && !ui?.isStarttoren)) {
            documenten.excluded = true;
        } else {
            documenten.excluded = false;
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
        if (verbergen.includes('transacties')) {
            transacties.excluded = true;
        } else {
            transacties.excluded = !ui?.isBeheerder && !ui?.isBeheerderDDWV;
        }

        // alleen beheer-rapportage in het menu als we voldoende scherm ter beschikking hebben
        const audit = this.beheerRoutes.find(route => route.path == "audit") as CustomRoute;
        if (verbergen.includes('audit') || (window.innerWidth < 600)) {
            audit.excluded = true;
        } else {
            audit.excluded = false;
        }

        // alleen beheer-rapportage in het menu als we voldoende scherm ter beschikking hebben
        const rapportage = this.beheerRoutes.find(route => route.path == "rapportage") as CustomRoute;
        if (verbergen.includes('rapportage') || (this.sharedService.getSchermSize() < SchermGrootte.lg) || (window.innerHeight < 600)) {
            rapportage.excluded = true;
        } else {
            rapportage.excluded = !(ui?.isBeheerder || ui?.isCIMT);
        }

        const facturen = this.beheerRoutes.find(route => route.path == "facturen") as CustomRoute;
        if (verbergen.includes('facturen') || (this.sharedService.getSchermSize() < SchermGrootte.lg) || (window.innerHeight < 600)) {
            facturen.excluded = true;
        } else {
            facturen.excluded = !(ui?.isBeheerder);
        }
    }

    // array met alleen de active routes
    activeRoutes() {
        return this.routes.filter(route => route.excluded === false);
    }

    // array met alleen de active routes
    activeBeheerRoutes() {
        return this.beheerRoutes.filter(route => route.excluded === false);
    }

    // het is voorbij en we gaan terug naar de login pagina
    Uitloggen(): void {
        this.loginService.uitloggen();
        this.router.navigate(['/login']);
    }

    //  Er is een nieuwe datum is gekozen
    NieuweDatum(datum: NgbDate) {
        this.datumDMY = datum.day + "-" + datum.month + "-" + datum.year;
    }

    toonLogo() {
        return (window.innerHeight > 1000)
    }

    kleineDatum() {
        if (this.hoofdscherm)
            return (window.innerHeight < 670)

        return (window.innerHeight < 850 || this.sharedService.getSchermSize() < SchermGrootte.xxl)
    }

    toonIcon(iconNaam:string) : IconDefinition {
        let parts: string[] = iconNaam.split(' ');
        let faIcon: IconDefinition = fas['faQuestion'];

        if (parts.length != 2) {
            console.error('iconNaam moet 2 parameters hebben');
        } else {
            if (parts[0] == 'fas') {
                faIcon = fas['fa' + parts[1]];
            } else {
                faIcon =  far['fa' + parts[1]];
            }

            // als een verkeerde naam is opgegeven tonen we een uitroepteken en printen alle mogelijkheden in console
            if (!faIcon) {
                console.log('fa' + parts[1]);
                console.log('fas', fas);
                console.log('far', far);
                faIcon = fas['faExclamation'];
            }
        }
        return faIcon;
    }
}
