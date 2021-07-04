import {Component} from '@angular/core';
import {routes} from '../../routing.module';
import {LoginService} from '../../services/apiservice/login.service';
import {ActivatedRoute, Router} from '@angular/router';
import {faSignOutAlt} from '@fortawesome/free-solid-svg-icons';
import {NgbCalendar, NgbDate, NgbDatepickerNavigateEvent, NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {SharedService} from "../../services/shared/shared.service";
import {DateTime} from "luxon";
import {StartlijstService} from "../../services/apiservice/startlijst.service";
import {DaginfoService} from "../../services/apiservice/daginfo.service";
import {HeliosActie, KalenderMaand} from "../../types/Utils";


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

    vliegdagen: string = "";
    daginfo: string = "";

    constructor(private readonly loginService: LoginService,
                private readonly startlijstService: StartlijstService,
                private readonly daginfoService: DaginfoService,
                private readonly sharedService: SharedService,
                private readonly router: Router,
                private readonly calendar: NgbCalendar,
                private activatedRoute: ActivatedRoute) {
        console.log(routes);
        console.log(activatedRoute);

        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Daginfo") {
                if (ev.actie == HeliosActie.Delete || ev.actie == HeliosActie.Restore) {
                    this.daginfoService.getDagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.daginfo = JSON.stringify(dataset);
                    });
                }
                else if (!this.daginfo.includes(ev.data.DATUM)) {
                    // nieuwe daginfo ophalen als we deze dag nog niet hebben

                    this.daginfoService.getDagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.daginfo = JSON.stringify(dataset);
                    });
                }
            }

            if (ev.tabel == "Startlijst") {
                if (ev.actie == HeliosActie.Delete || ev.actie == HeliosActie.Restore) {
                    this.startlijstService.getVliegdagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.vliegdagen = JSON.stringify(dataset);
                    });
                } else if (!this.vliegdagen.includes(ev.data.DATUM)) {
                    // nieuwe vliegdagen ophalen als we deze dag nog niet hebben

                    this.startlijstService.getVliegdagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.vliegdagen = JSON.stringify(dataset);
                    });
                }
            }
        });
    }

    Uitloggen(): void {
        this.loginService.uitloggen();
        this.router.navigate(['/login']);
    }

    NieuweDatum(datum: NgbDate) {
        this.sharedService.zetKalenderDatum(this.kalenderIngave)
    }

    // de kalender popup toont andere maand, ophalen vliegdagen
    KalenderAndereMaand($event: NgbDatepickerNavigateEvent) {
        this.kalenderMaand = $event.next;
        this.sharedService.zetKalenderMaand(this.kalenderMaand);

        let maanden = [31, 28, 31, 30, 31, 30, 30, 31, 30, 31, 30, 31];
        this.startDatum = DateTime.fromObject({
            year: this.kalenderMaand.year,
            month: this.kalenderMaand.month,
            day: 1
        })
        this.eindDatum = DateTime.fromObject({
            year: this.kalenderMaand.year,
            month: this.kalenderMaand.month,
            day: maanden[this.kalenderMaand.month - 1]
        })

        this.startlijstService.getVliegdagen(this.startDatum, this.eindDatum).then((dataset) => {
            this.vliegdagen = JSON.stringify(dataset);
        });

        this.daginfoService.getDagen(this.startDatum, this.eindDatum).then((dataset) => {
            this.daginfo = JSON.stringify(dataset);
        });
    }

    // highlight de dag als er starts zijn geweest
    cssCustomDay(date: NgbDate): string {
        let datum: DateTime = DateTime.fromObject({year: date.year, month: date.month, day: date.day})

        let classes = "";
        if (this.vliegdagen.includes(datum.toISODate())) {
            classes += " vliegdag";
        }

        if (this.daginfo.includes(datum.toISODate())) {
            classes += " daginfo";
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
