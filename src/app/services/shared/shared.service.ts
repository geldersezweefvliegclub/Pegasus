import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { ErrorMessage, HeliosEvent, KalenderMaand } from '../../types/Utils';
import { DateTime } from 'luxon';


export interface FilterLedenData {
    leden: boolean,
    ddwv: boolean,
    crew: boolean,
    wachtlijst: boolean,
    lieristen: boolean,
    lio: boolean,
    startleiders: boolean,
    instructeurs: boolean,
    sleepvliegers: boolean,
    gastenVliegers: boolean,
}

export enum SchermGrootte {
    /* bootstrap defintie
    X-Small	            xs	<576px
    Small	            sm	≥576px
    Medium	            md	≥768px
    Large	            lg	≥992px
    Extra large	        xl	≥1200px
    Extra extra large	xxl	≥1400px
    */
    xs,
    sm,
    md,
    lg,
    xl,
    xxl
}

@Injectable({
    providedIn: 'root'
})
export class SharedService {
    nu = new Date()
    vandaag: NgbDateStruct = {
        year: this.nu.getFullYear(),
        month: this.nu.getMonth() + 1,
        day: this.nu.getDate()
    };

    private datum: NgbDateStruct;
    private kalenderMaand: KalenderMaand = {year: 1900, month: 1};                          // initieele waarde ver in verleden

    private datumStore = new BehaviorSubject(this.vandaag);
    private kalenderMaandStore = new BehaviorSubject(this.kalenderMaand);

    private heliosEventSubject: Subject<HeliosEvent> = new Subject<HeliosEvent>();          // starts in de database is aangepast
    private heliosFailedSubject: Subject<ErrorMessage> = new Subject<ErrorMessage>();       // api call heef gefaald

    private resizeSubject = new Subject<Window>();                                                 // resize window, of draaien mobiel device

    public readonly ingegevenDatum = this.datumStore.asObservable();                // nieuwe datum gekozen
    public readonly kalenderMaandChange = this.kalenderMaandStore.asObservable();   // nieuwe maand / jaar gekozen in de kalender

    // om de ledenlijst te filteren
    public ledenlijstFilter: FilterLedenData = {
        leden: true,
        ddwv: false,
        crew: false,
        wachtlijst: false,
        instructeurs: false,
        startleiders: false,
        lieristen: false,
        lio: false,
        sleepvliegers: false,
        gastenVliegers: false
    }

    // laat andere component weten dat er iets in de database is aangepast
    public readonly heliosEventFired: Observable<HeliosEvent> = this.heliosEventSubject.asObservable();

    // laat andere component weten dat er iets in de database is aangepast
    public readonly heliosEventFailed: Observable<ErrorMessage> = this.heliosFailedSubject.asObservable();


    constructor() {
        fromEvent(window, 'resize').subscribe((x: Event) => this.resizeSubject.next(x.target as Window));
    }


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

    // Er is iets in de database gewijzigd
    fireHeliosFailure(error: ErrorMessage) {
        this.heliosFailedSubject.next(error);
    }

    datumDMJ(ISOdatum: string): string {
        if (ISOdatum.includes(":"))     // er zit ook een tijd in
        {
            const datePart = ISOdatum.split(' ');
            ISOdatum = datePart[0];
        }
        const datum = ISOdatum.split('-');
        return datum[2] + '-' + datum[1] + '-' + datum[0];
    }

    datumDM(ISOdatum: string): string {
        if (ISOdatum.includes(":"))     // er zit ook een tijd in
        {
            const datePart = ISOdatum.split(' ');
            ISOdatum = datePart[0];
        }
        const datum = ISOdatum.split('-');
        return datum[2] + '-' + datum[1];
    }

    // Hebben we een datum in de toekomst, vandaag is geen toekomst
    datumInToekomst(datum: string): boolean {
        const nu: DateTime = DateTime.now();
        const d: DateTime = DateTime.fromSQL(datum);

        return (d > nu) // datum is in het toekomst
    }

    get onResize$(): Observable<Window> {
        return this.resizeSubject.asObservable();
    }

    // Wat is scherm grootte
    public getSchermSize() : SchermGrootte {
        if (window.innerWidth >= 1400) {
            return SchermGrootte.xxl;
        }
        else if (window.innerWidth >= 1200) {
            return SchermGrootte.xl;
        }
        else if (window.innerWidth >= 992) {
            return SchermGrootte.lg;
        }
        else if (window.innerWidth >= 768) {
            return SchermGrootte.md;
        }
        else if (window.innerWidth >= 576) {
            return SchermGrootte.sm;
        }
        return SchermGrootte.xs;
    }
}

