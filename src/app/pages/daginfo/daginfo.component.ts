import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgbDatepicker, NgbDatepickerI18n, NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-daginfo',
  templateUrl: './daginfo.component.html',
  styleUrls: ['./daginfo.component.scss']
})
export class DaginfoComponent  {
  @Input() datum: NgbDateStruct;

  @ViewChild(NgbDatepicker, {static: true}) datepicker: NgbDatepicker;

  constructor(public i18n: NgbDatepickerI18n) {
    setInterval(() => console.log(this.datum), 2000)
  }

  navigate(number: number) {
    const {state, calendar} = this.datepicker;
    this.datepicker.navigateTo(calendar.getNext(state.firstDate, 'm', number));
  }

  today() {
    const {calendar} = this.datepicker;
    this.datepicker.navigateTo(calendar.getToday());
  }


}
