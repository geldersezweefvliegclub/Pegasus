import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {HeliosEvent, KalenderMaand} from "../../types/Utils";


export interface FilterLedenData {
    leden: boolean,
    ddwv: boolean,
    crew: boolean,
    lieristen: boolean,
    startleiders: boolean,
    instructeurs: boolean,
}


@Injectable({
    providedIn: 'root'
})
export class SharedService {

    constructor() {
    }

    nu = new Date()
    vandaag: NgbDateStruct = {
        year: this.nu.getFullYear(),
        month: this.nu.getMonth() + 1,
        day: this.nu.getDate()
    };

    private datum: NgbDateStruct;
    private kalenderMaand: KalenderMaand = {year: this.vandaag.year, month: this.vandaag.month};

    private datumStore = new BehaviorSubject(this.vandaag);
    private kalenderMaandStore = new BehaviorSubject(this.kalenderMaand);

    private heliosEventSubject: Subject<HeliosEvent> = new Subject<HeliosEvent>();  // data in de database is aangepast

    public readonly ingegevenDatum = this.datumStore.asObservable();                // nieuwe datum gekozen
    public readonly kalenderMaandChange = this.kalenderMaandStore.asObservable();   // nieuwe maand / jaar gekozen in de kalender

    // om de ledenlijst te filteren
    public ledenlijstFilter: FilterLedenData = {
        leden: true,
        ddwv: false,
        crew: false,
        instructeurs: false,
        startleiders: false,
        lieristen: false
    }

    // laat andere component weten dat er iets in de database is aangepast
    public readonly heliosEventFired: Observable<HeliosEvent> = this.heliosEventSubject.asObservable();

    // afvuren event dat een andere maand / jaar gekozen is in de kalender
    zetKalenderMaand(kalenderMaand: KalenderMaand) {
        this.kalenderMaandStore.next(kalenderMaand)
    }

    // De gebruiker heeft een andere datum gekozen in de kalender
    zetKalenderDatum(datum: NgbDateStruct) {
        this.datum = datum;
        this.datumStore.next(datum)
    }

    // Er is iets in de database gewijzigd
    fireHeliosEvent(event: HeliosEvent) {
        this.heliosEventSubject.next(event);
    }
}
