import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {NgbDate} from "@ng-bootstrap/ng-bootstrap/datepicker/ngb-date";
import {HeliosActie, HeliosEvent, KalenderMaand} from "../../types/Utils";

@Injectable({
    providedIn: 'root'
})
export class SharedService {

    constructor() {
    }

    nu = new Date()
    vandaag:NgbDateStruct = { year: this.nu.getFullYear(),
                              month: this.nu.getMonth()+1,
                              day: this.nu.getDate() };

    kalenderIngave: NgbDateStruct;
    kalenderMaand: KalenderMaand = {year: this.vandaag.year, month: this.vandaag.month};

    private datumStore = new BehaviorSubject(this.vandaag);
    private kalenderMaandStore = new BehaviorSubject( this.kalenderMaand);

    private heliosEventSubject: Subject<HeliosEvent> = new Subject<HeliosEvent>();



    public readonly ingegevenDatum = this.datumStore.asObservable();
    public readonly ingegevenKalenderMaand = this.kalenderMaandStore.asObservable();
    public readonly heliosEventFired: Observable<HeliosEvent> = this.heliosEventSubject.asObservable();

    zetKalenderDatum(datum: NgbDateStruct) {
        this.datumStore.next(datum)
    }

    zetKalenderMaand(kalenderMaand: KalenderMaand) {
        this.kalenderMaandStore.next(kalenderMaand)
    }

    // Er is iets in de database gewijzigd
    fireHeliosEvent(event: HeliosEvent) {
        this.heliosEventSubject.next(event);
    }
}
