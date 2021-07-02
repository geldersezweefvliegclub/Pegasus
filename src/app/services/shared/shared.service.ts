import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {NgbDate} from "@ng-bootstrap/ng-bootstrap/datepicker/ngb-date";

@Injectable({
    providedIn: 'root'
})
export class SharedService {

    constructor() {
    }

    nu = new Date()
    vandaag:NgbDateStruct = { year: this.nu.getFullYear(),
                              month: this.nu.getMonth(),
                              day: this.nu.getDay() };

    private datumStore = new BehaviorSubject(this.vandaag);
    ingegevenDatum = this.datumStore.asObservable();
    kalenderIngave: NgbDateStruct;

    zetKalenderDatum(datum: NgbDateStruct) {
        this.datumStore.next(datum)
    }
}
