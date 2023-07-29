import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgbDate, NgbDateParserFormatter, NgbDatepickerNavigateEvent, NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {DateTime} from "luxon";
import {ModalComponent} from "../../modal/modal.component";
import {NgbDateFRParserFormatter} from "../../../ngb-date-fr-parser-formatter";

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

  NieuweDatum($event: NgbDate) {
    this.dateSelect.emit($event);
    this.popup.close();
  }

  KalenderAndereMaand($event: NgbDatepickerNavigateEvent) {
    this.navigate.emit($event);
  }
}
