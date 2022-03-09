import {HostListener, Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {ErrorMessage, HeliosEvent, KalenderMaand} from '../../types/Utils';


export interface FilterLedenData {
    leden: boolean,
    ddwv: boolean,
    crew: boolean,
    lieristen: boolean,
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

    private heliosEventSubject: Subject<HeliosEvent> = new Subject<HeliosEvent>();          // data in de database is aangepast
    private heliosFailedSubject: Subject<ErrorMessage> = new Subject<ErrorMessage>();       // api call heef gefaald

    public readonly ingegevenDatum = this.datumStore.asObservable();                // nieuwe datum gekozen
    public readonly kalenderMaandChange = this.kalenderMaandStore.asObservable();   // nieuwe maand / jaar gekozen in de kalender

    // om de ledenlijst te filteren
    public ledenlijstFilter: FilterLedenData = {
        leden: true,
        ddwv: false,
        crew: false,
        instructeurs: false,
        startleiders: false,
        lieristen: false,
        sleepvliegers: false,
        gastenVliegers: false
    }

    // laat andere component weten dat er iets in de database is aangepast
    public readonly heliosEventFired: Observable<HeliosEvent> = this.heliosEventSubject.asObservable();

    // laat andere component weten dat er iets in de database is aangepast
    public readonly heliosEventFailed: Observable<ErrorMessage> = this.heliosFailedSubject.asObservable();

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
