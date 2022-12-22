import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgbDate, NgbDateParserFormatter, NgbDatepickerNavigateEvent, NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {DateTime} from "luxon";
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {NgbDateFRParserFormatter} from "../../../shared/ngb-date-fr-parser-formatter";

@Component({
  selector: 'app-popup-kalender',
  templateUrl: './popup-kalender.component.html',
  styleUrls: ['./popup-kalender.component.scss'],
  providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class PopupKalenderComponent {
  @Input() kalenderEersteDatum: NgbDateStruct;
  @Input() kalenderLaatsteDatum: NgbDateStruct;
  @Input() kalenderIngave: NgbDateStruct;
  @Input() vliegdagen: string = "";        // vliegdagen van deze maand in json formaat
  @Input() diensten: string = "";          // daginfos van deze maand in json formaat
  @Input() daginfo: string = "";           // daginfos van deze maand in json formaat

  @Output() dateSelect: EventEmitter<NgbDate> = new EventEmitter<NgbDate>();
  @Output() navigate: EventEmitter<NgbDatepickerNavigateEvent> = new EventEmitter<NgbDatepickerNavigateEvent>();

  @ViewChild(ModalComponent) private popup: ModalComponent;

  constructor() { }

  // Open dialoog met de kalender
  openPopup() {
    this.popup.open();
  }

  // highlight de dag als er starts zijn geweest
  cssCustomDay(date: NgbDate): string {
    const datum: DateTime = DateTime.fromObject({year: date.year, month: date.month, day: date.day})

    let classes = "";
    if (this.vliegdagen.includes(datum.toISODate())) {
      classes += " vliegdag";
    }

    if (this.daginfo.includes(datum.toISODate())) {
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
    this.popup.close();
  }

  KalenderAndereMaand($event: NgbDatepickerNavigateEvent) {
    this.navigate.emit($event);
  }
}
