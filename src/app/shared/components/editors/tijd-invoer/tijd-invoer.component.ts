import {Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../../modal/modal.component";
import {HeliosStart, HeliosStartDataset} from "../../../../types/Helios";
import {StartlijstService} from "../../../../services/apiservice/startlijst.service";

import {Observable} from 'rxjs';
import {NgbTypeaheadConfig} from '@ng-bootstrap/ng-bootstrap';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {getSunrise, getSunset} from 'sunrise-sunset-js';
import {environment} from "../../../../../environments/environment";
import {DateTime} from "luxon";
import {CustomError} from "../../../../types/Utils";

enum TypeTijdInvoer {
    Starttijd,
    Landingstijd
}

@Component({
    selector: 'app-tijd-invoer',
    templateUrl: './tijd-invoer.component.html',
    styleUrls: ['./tijd-invoer.component.scss'],
    providers: [NgbTypeaheadConfig] // add NgbTypeaheadConfig to the component providers
})

export class TijdInvoerComponent {
    @Output() OpslaanStarttijd: EventEmitter<HeliosStart> = new EventEmitter<HeliosStart>();
    @Output() OpslaanLandingstijd: EventEmitter<HeliosStart> = new EventEmitter<HeliosStart>();

    @ViewChild(ModalComponent) private popup: ModalComponent;
    @ViewChild('tijdInvoerElement') tijdInvoerElement: ElementRef;

    error: CustomError | undefined;
    start: HeliosStart;

    isLoading: boolean = false;
    formTitel: string = "";
    label: string = "";
    overdag: string[];

    tijdIngevoerd: string;
    tijdOK: boolean = true;

    Invoer: TypeTijdInvoer = TypeTijdInvoer.Starttijd;

    constructor(private readonly startlijstService: StartlijstService, config: NgbTypeaheadConfig) {
        config.showHint = true;
    }

    // opbouwen van popup lijst
    search = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            map(term => term.length < 2 ? []
                : this.overdag.filter(v => v.startsWith(term)).splice(0, 10)    // max 10 items
            )
        );

    openStarttijdPopup(record: HeliosStartDataset) {
        this.Invoer = TypeTijdInvoer.Starttijd;                 // dan weten we later dat we een starttijd aan het invoeren zijn

        this.haalStartOp(record.ID as number).then(() => {
            this.vullenOverdag(this.vanTijd(), this.totTijd())
            if (this.start.STARTTIJD) {
                this.tijdIngevoerd = this.start.STARTTIJD;      // starttijd kan ondertussen gewijzigd zijn
            } else if (!this.overdag.includes(this.tijdIngevoerd)) {
                this.tijdIngevoerd = "";    // actuele tijd buiten daglicht periode
                this.tijdOK = false;
            }
        });

        this.formTitel = 'Vlucht: #' + record.DAGNUMMER + ', ' + record.REG_CALL;
        this.label = 'Start';

        if (record.STARTTIJD) {
            this.tijdIngevoerd = record.STARTTIJD;
            this.tijdOK = true;
        } else {
            // Zet de huidige tijd als default
            this.tijdIngevoerd = DateTime.now().toISOTime().substring(0, 5);
            this.tijdOK = true;
        }
        this.popup.open();
    }

    openLandingsTijdPopup(record: HeliosStartDataset) {
        this.Invoer = TypeTijdInvoer.Landingstijd;                 // dan weten we later dat we een landingstijd aan het invoeren zijn

        this.haalStartOp(record.ID as number).then(() => {
            this.vullenOverdag(this.vanTijd(), this.totTijd())
            if (this.start.LANDINGSTIJD) {
                this.tijdIngevoerd = this.start.LANDINGSTIJD;       // landingstijd kan ondertussen gewijzigd zijn
            } else if (!this.overdag.includes(this.tijdIngevoerd)) {
                this.tijdIngevoerd = "";    // actuele tijd buiten daglicht periode
                this.tijdOK = false;
                console.log("leeg")
            }
        });

        this.formTitel = 'Vlucht: #' + record.DAGNUMMER + ', ' + record.REG_CALL;
        this.label = 'Landing';

        if (record.LANDINGSTIJD) {
            this.tijdIngevoerd = record.LANDINGSTIJD;
            this.tijdOK = true;
        } else {
            // Zet de huidige tijd als default
            this.tijdIngevoerd = DateTime.now().toISOTime().substring(0, 5);
            this.tijdOK = true;
        }
        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }

    // ophalen van de start, zodat we altijd met de laatste data werken
    async haalStartOp(id: number): Promise<void> {
        this.isLoading = true;

        try {
            await this.startlijstService.getStart(id).then((start) => {
                this.start = start;
                this.isLoading = false;
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    // Nu is het tijd om de ingevoerde tijd op te slaan
    opslaan() {
        const TimeParts = this.tijdIngevoerd.split(':')
        let tijd: string | undefined = undefined;

        if (TimeParts.length > 1) {   // zorg dat we goede formaat hebben
            const hrs: string = TimeParts[0];
            const min: string = (TimeParts[1] + "00").substring(0, 2); // ivm autocomplete moeten we aanvullen
            tijd = hrs + ":" + min
        }

        if (this.Invoer == TypeTijdInvoer.Starttijd) {
            this.start.STARTTIJD = tijd;
            this.OpslaanStarttijd.emit(this.start);
        }
        else {
            this.start.LANDINGSTIJD = tijd;
            this.OpslaanLandingstijd.emit(this.start);
        }
    }

    // De eerste tjd
    vanTijd(): Date {
        const d = new Date(this.start.DATUM as string);
        const sunrise: Date = getSunrise(environment.latitude, environment.longitude, d);

        let begin: Date = sunrise;

        if (this.start.VELD_ID == -1) {
            // VELD_ID = xxx Starten op ander veld, dan klopt sunrise niet. Dan maar vanaf 9:00
            begin = new Date(new Date().setHours(9));
        }

        // Als we ladingstijd invoeren, moet de tijd later zijn dan de starttijd
        if (this.Invoer == TypeTijdInvoer.Landingstijd  &&  this.start.STARTTIJD) {
            const TimeParts = this.start.STARTTIJD.split(':')
            begin.setHours(+TimeParts[0], +TimeParts[1]);
        }
        return begin;
    }

    // wat is de laatste tijd die ingevoerd mag worden
    totTijd(): Date {
        const d = new Date(this.start.DATUM as string);
        let sunset: Date = getSunset(environment.latitude, environment.longitude, d);
        sunset.setHours(sunset.getHours() + 1); // 1 uurtje extra voor landing in schemer

        // VELD_ID = xxx Starten op ander veld, dan klopt sunset niet. Dan maar tot 22:00
        return (this.start.VELD_ID == -1) ? new Date(new Date().setHours(22)) : sunset;
    }

    // vul een array met tijden van - tot
    vullenOverdag(van: Date, tot: Date): void {
        const start: number = van.getHours() * 60 + van.getMinutes();
        const eind: number = tot.getHours() * 60 + tot.getMinutes();

        this.overdag = [];
        for (let min = start; min <= eind; min++) {
            let uurStr = Math.floor(min / 60).toString().padStart(2, '0');
            let minStr = (min % 60).toString().padStart(2, '0');
            this.overdag.push(uurStr + ":" + minStr);
        }
    }

    // Help de gebruiker om invoer slimmer te maken, bijv toevoegen van : of een voorloop nul
    // Zorg ook dat maximale input 5 tekens is.
    veldInvoer(newValue: string) {
        let output: string;
        let inputParts = newValue.split(':');

        if ((+inputParts[0] > 2) && (+inputParts[0] <= 9)) {
            output = inputParts[0].toString().padStart(2, '0');
        } else {
            output = inputParts[0];
        }

        if (output.length == 2) {
            output += ":";
        }

        if (inputParts.length > 1) {
            if ((+inputParts[1] > 5) && (+inputParts[1] <= 9)) {
                output += inputParts[1].toString().padStart(2, '0');
            } else {
                output += inputParts[1];
            }
        }

        this.tijdInvoerElement.nativeElement.value = output.substring(0, 5);
        const result = this.overdag.findIndex((t) =>
                    {
                        return t.startsWith(this.tijdInvoerElement.nativeElement.value);
                    }, this.tijdInvoerElement.nativeElement.value);

        // tijd moet overdag zijn en volledig zijn. als tijdOK = true, dan kan je pas opslaan
        this.tijdOK = !!((result && (inputParts.length > 1)) || this.tijdIngevoerd == "");
    }

    // Welke invoer staan we toe, alleen cijfers en control toetsen
    keyDown(event: KeyboardEvent) {
        if ((event.key == "ArrowDown") || (event.key == "ArrowUp") || (event.key == "ArrowLeft") || (event.key == "ArrowRight")) {
            return;
        }

        if ((event.key == "End") || (event.key == "Home")) {
            return;
        }

        if ((event.key == "Copy") || (event.key == "Paste") || (event.key == "Cut")) {
            return;
        }

        if ((event.key == "Delete") || (event.key == "Backspace")) {
            return;
        }

        if ((event.key.match(/[0-9]/)) && (this.tijdIngevoerd.length < 5)) {
            return;
        }

        event.preventDefault();
    }

    // Ingevoerde tijd wordt een minuutje later
    timeUp() {
        let TijdParts = this.tijdInvoerElement.nativeElement.value.split(':');

        let minuten = +TijdParts[0] * 60;
        minuten += (TijdParts.length > 1) ? +TijdParts[1] : 0;

        minuten++;

        let uurStr = Math.floor(minuten / 60).toString().padStart(2, '0');
        let minStr = (minuten % 60).toString().padStart(2, '0');
        const tijd: string = (uurStr + ":" + minStr);

        if (this.overdag.includes(tijd)) {
            this.tijdIngevoerd = tijd;
        }
    }

    // Ingevoerde tijd wordt een minuutje eerder
    timeDown() {
        let TijdParts = this.tijdInvoerElement.nativeElement.value.split(':');

        let minuten = +TijdParts[0] * 60;
        minuten += (TijdParts.length > 1) ? +TijdParts[1] : 0;

        minuten--;

        let uurStr = Math.floor(minuten / 60).toString().padStart(2, '0');
        let minStr = (minuten % 60).toString().padStart(2, '0');
        const tijd: string = (uurStr + ":" + minStr);

        if (this.overdag.includes(tijd)) {
            this.tijdIngevoerd = tijd;
        }
    }
}
