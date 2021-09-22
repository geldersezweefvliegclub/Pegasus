import {Component} from '@angular/core';
import {CustomRoute, routes} from '../../routing.module';

import {Router} from '@angular/router';
import {faSignOutAlt} from '@fortawesome/free-solid-svg-icons';
import {NgbCalendar, NgbDate, NgbDatepickerNavigateEvent, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {SharedService} from '../../services/shared/shared.service';
import {DateTime} from 'luxon';

import {HeliosActie, KalenderMaand} from '../../types/Utils';
import {getBeginEindDatumVanMaand} from '../../utils/Utils';

import {LoginService} from '../../services/apiservice/login.service';
import {HeliosRoosterDataset} from "../../types/Helios";
import {RoosterService} from "../../services/apiservice/rooster.service";
import {DienstenService} from "../../services/apiservice/diensten.service";
import {VliegtuigenService} from "../../services/apiservice/vliegtuigen.service";
import {StartlijstService} from '../../services/apiservice/startlijst.service';
import {DaginfoService} from '../../services/apiservice/daginfo.service';


@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
    routes = routes;
    logUit = faSignOutAlt;

    kalenderMaand: KalenderMaand;
    startDatum: DateTime;
    eindDatum: DateTime;

    vandaag = this.calendar.getToday();
    kalenderIngave: NgbDateStruct = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day};  // de gekozen dag

    kalenderEersteDatum: NgbDateStruct;
    kalenderLaatsteDatum: NgbDateStruct;

    vliegdagen: string = "";        // vliegdagen van deze maand in json formaat
    diensten: string = "";          // daginfos van deze maand in json formaat
    daginfo: string = "";           // daginfos van deze maand in json formaat

    dienstenTimer: number;          // kleine vertraging om data ophalen te beperken

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

        this.toonMenuItems();

        // Als daginfo of startlijst is aangepast, moet we kalender achtergrond ook updaten
        this.sharedService.heliosEventFired.subscribe(ev => {
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
            if (ev.tabel == "Vliegtuigen") {
                this.vliegtuigenBatch();
            }
            if (ev.tabel == "Diensten") {
                clearTimeout(this.dienstenTimer);

                // Wacht even de gebruiker kan nog aan het typen zijn
                this.dienstenTimer = window.setTimeout(() => {
                    const ui = this.loginService.userInfo?.LidData;
                    this.dienstenService.getDiensten (this.startDatum, this.eindDatum, undefined, ui?.ID ).then((dataset) => {
                        this.diensten = JSON.stringify(dataset);
                    });

                }, 400);
            }
        });

        this.vliegtuigenBatch();
    }

    // bepaald de batch voor vliegtuigen menu, wordt getoond als clubkist niet inzetbaar is
    vliegtuigenBatch() {
        this.vliegtuigenService.getVliegtuigen(false, undefined, {CLUBKIST: "true"}).then((kisten) => {
            let nietInzetbaar = 0;

            kisten.forEach(kist => {
                if (!kist.INZETBAAR) nietInzetbaar++;
            });

            const v = this.routes.find(route => route.path == "vliegtuigen") as CustomRoute;
            v.batch = nietInzetbaar;
        })
    }

    // welke menu items mogen getoond worden
    toonMenuItems() {
        const ui = this.loginService.userInfo?.Userinfo;

        const tracks = this.routes.find(route => route.path == "tracks") as CustomRoute;
        if (!ui?.isCIMT && !ui?.isInstructeur && !ui?.isBeheerder) {
            tracks.excluded = true
        }

        const daginfo = this.routes.find(route => route.path == "daginfo") as CustomRoute;
        daginfo.excluded = true;    // default, daginfo is niet van toepassing voor de meeste leden

        // laten we dag info zien
        if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isInstructeur || ui?.isCIMT || ui?.isStarttoren || ui?.isDDWVCrew) {
            daginfo.excluded = false;
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
        this.dienstenService.getDiensten (this.startDatum, this.eindDatum, undefined, ui?.ID ).then((dataset) => {
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
}
