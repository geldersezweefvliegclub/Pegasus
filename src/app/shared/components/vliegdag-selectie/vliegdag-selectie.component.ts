import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgbDate, NgbDatepickerNavigateEvent, NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {DateTime} from "luxon";

@Component({
  selector: 'app-vliegdag-selectie',
  templateUrl: './vliegdag-selectie.component.html',
  styleUrls: ['./vliegdag-selectie.component.scss']
})
export class VliegdagSelectieComponent {
  @Input() kalenderEersteDatum: NgbDateStruct;
  @Input() kalenderLaatsteDatum: NgbDateStruct;
  @Input() kalenderIngave: NgbDateStruct;
  @Input() vliegdagen: string = "";        // vliegdagen van deze maand in json formaat
  @Input() diensten: string = "";          // daginfos van deze maand in json formaat
  @Input() daginfo: string = "";           // daginfos van deze maand in json formaat

  @Output() navigate: EventEmitter<NgbDatepickerNavigateEvent> = new EventEmitter<NgbDatepickerNavigateEvent>();
  @Output() dateSelect: EventEmitter<NgbDate> = new EventEmitter<NgbDate>();

  cssCustomDay(date: NgbDate): string {
    const datum: DateTime = DateTime.fromObject({year: date.year, month: date.month, day: date.day})

    let classes = "";
    if (this.vliegdagen.includes(datum.toISODate() as string)) {
      classes += " vliegdag";
    }

    if (this.daginfo.includes(datum.toISODate() as string)) {
      classes += " dagrapport";
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

  NieuweDatum($event: NgbDate) {
    this.dateSelect.emit($event);
  }

  KalenderAndereMaand($event: NgbDatepickerNavigateEvent) {
    this.navigate.emit($event);
  }
}
