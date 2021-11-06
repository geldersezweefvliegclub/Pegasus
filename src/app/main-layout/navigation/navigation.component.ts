import {Component, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {CustomRoute, beheerRoutes, routes} from '../../routing.module';

import {Router} from '@angular/router';
import {faBug, faSignOutAlt, faWrench} from '@fortawesome/free-solid-svg-icons';
import {NgbCalendar, NgbDate, NgbDatepickerNavigateEvent, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {SharedService} from '../../services/shared/shared.service';
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

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit, OnDestroy  {
    @Input() topMenu: boolean = false;

    readonly routes = routes;
    readonly beheerRoutes = beheerRoutes;
    readonly logUitIcon: IconDefinition = faSignOutAlt;
    readonly beheerIcon: IconDefinition = faWrench;

    kalenderMaand: KalenderMaand;
    startDatum: DateTime;
    eindDatum: DateTime;
    showBeheer: boolean = false;

    vandaag = this.calendar.getToday();
    kalenderIngave: NgbDateStruct = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day};  // de gekozen dag

    kalenderEersteDatum: NgbDateStruct;
    kalenderLaatsteDatum: NgbDateStruct;

    vliegdagen: string = "";        // vliegdagen van deze maand in json formaat
    diensten: string = "";          // daginfos van deze maand in json formaat
    daginfo: string = "";           // daginfos van deze maand in json formaat

    private dienstenAbonnement: Subscription;
    private dbEventAbonnement: Subscription;
    private vliegtuigenAbonnement: Subscription;

    constructor(private readonly loginService: LoginService,
                private readonly startlijstService: StartlijstService,
                private readonly daginfoService: DaginfoService,
                private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly sharedService: SharedService,
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
    }

    ngOnDestroy(): void {
        if (this.dienstenAbonnement)    this.dienstenAbonnement.unsubscribe();
        if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
    }

    // welke menu items mogen getoond worden
    toonMenuItems() {
        const ui = this.loginService.userInfo?.Userinfo;

        const tracks = this.routes.find(route => route.path == "tracks") as CustomRoute;
        tracks.excluded = true  // default, daginfo is niet van toepassing voor de meeste leden
        if (ui?.isCIMT || ui?.isInstructeur || ui?.isBeheerder) {
            tracks.excluded = false
        }

        const daginfo = this.routes.find(route => route.path == "daginfo") as CustomRoute;
        daginfo.excluded = true;    // default, daginfo is niet van toepassing voor de meeste leden

        // laten we dag info zien
        if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isInstructeur || ui?.isCIMT || ui?.isStarttoren || ui?.isDDWVCrew) {
            daginfo.excluded = false;
        }

        // starttoren heeft geen dashboard
        const dashboard = this.routes.find(route => route.path == "dashboard") as CustomRoute;
        if (ui?.isStarttoren) {
            dashboard.excluded = true
        }

        // alleen echter gebruiker hebben profiel, starttoren, zusterclubs, etc dus niet
        const profiel = this.routes.find(route => route.path == "profiel") as CustomRoute;
        if (!ui?.isDDWV && !ui?.isClubVlieger) {
            profiel.excluded = true
        }

        // alleen echter gebruiker hebben toegang tot ledenlijst, starttoren, zusterclubs, etc dus niet
        const leden = this.routes.find(route => route.path == "leden") as CustomRoute;
        if (!ui?.isDDWV && !ui?.isClubVlieger && !ui?.isStarttoren) {
            leden.excluded = true
        }

        // alleen echter gebruiker hebben toegang tot rooster, starttoren, zusterclubs, etc dus niet
        const rooster = this.routes.find(route => route.path == "rooster") as CustomRoute;
        if (!ui?.isDDWV && !ui?.isClubVlieger) {
            rooster.excluded = true
        }
    }

    // het is voorbij en we gaan terug naar de login pagina
    Uitloggen(): void {
        this.loginService.uitloggen();
        this.router.navigate(['/login']);
    }

    // laat iedereen weten dat er een nieuwe datum is gekozen
    NieuweDatum(datum: NgbDate) {
        this.sharedService.zetKalenderDatum(this.kalenderIngave)
    }

    // de kalender popup toont andere maand, ophalen vliegdagen
    KalenderAndereMaand($event: NgbDatepickerNavigateEvent) {
        this.kalenderMaand = $event.next;

        // laat iedereen weten dat we een ander maand-jaar hebben
        this.sharedService.zetKalenderMaand(this.kalenderMaand);

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
        return (((window.innerHeight > 725) && (!this.showBeheer)) || (window.innerHeight > 900))
    }
}
