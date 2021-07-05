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
import {KalenderMaand} from "../../types/Utils";


@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  routes = routes;
  logUit = faSignOutAlt;

  kalenderMaand: KalenderMaand;
  vandaag = this.calendar.getToday();
  kalenderIngave: NgbDateStruct = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day};  // de gekozen dag

  vliegdagen: string = "";
  daginfo: string = "";

  constructor(private readonly loginService: LoginService,
              private readonly startlijstService: StartlijstService,
              private readonly daginfoService: DaginfoService,
              private readonly sharedService: SharedService,
              private readonly router:Router,
              private readonly calendar: NgbCalendar,
              private activatedRoute: ActivatedRoute) {
    console.log(routes);
    console.log(activatedRoute);

    this.sharedService.heliosEventFired.subscribe(ev => {
      console.log(ev);
    });
  }

  Uitloggen(): void {
    this.loginService.uitloggen();
    this.router.navigate(['/login']);
  }

  NieuweDatum(datum: NgbDate) {
    this.sharedService.zetKalenderDatum (this.kalenderIngave)
  }

  // de kalender popup toont andere maand, ophalen vliegdagen
  KalenderAndereMaand($event: NgbDatepickerNavigateEvent) {
    this.kalenderMaand = $event.next;

    let maanden = [31, 28, 31, 30, 31, 30, 30, 31, 30, 31, 30, 31];
    let startDatum: DateTime = DateTime.fromObject({
      year: this.kalenderMaand.year,
      month: this.kalenderMaand.month,
      day: 1
    })
    let eindDatum: DateTime = DateTime.fromObject({
      year: this.kalenderMaand.year,
      month: this.kalenderMaand.month,
      day: maanden[this.kalenderMaand.month - 1]
    })

    this.sharedService.zetKalenderMaand(this.kalenderMaand);

    this.startlijstService.getVliegdagen(startDatum, eindDatum).then((dataset) => {
      this.vliegdagen = JSON.stringify(dataset);
    });

    this.daginfoService.getDagen(startDatum, eindDatum).then((dataset) => {
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

    const d = DateTime.fromObject({year: this.kalenderIngave.year, month: this.kalenderIngave.month, day: this.kalenderIngave.day});
    if (datum.toISODate() == d.toISODate()) {
      classes += " gekozenDatum";
    }

    return classes;
  }
}
