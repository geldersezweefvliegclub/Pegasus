import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import {
    HeliosVliegtuigenDatasetExtended,
} from '../../../../schermen/reservering/reservering-page/reservering-page.component';
import { ModalComponent } from '../../modal/modal.component';
import { Subscription } from 'rxjs';
import { HeliosLedenDataset, HeliosReservering } from '../../../../types/Helios';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import { LedenService } from '../../../../services/apiservice/leden.service';
import { NgbDate, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateFRParserFormatter } from '../../../ngb-date-fr-parser-formatter';
import { DateTime } from 'luxon';
import { ReserveringService } from '../../../../services/apiservice/reservering.service';

@Component({
    selector: 'app-boeking-editor',
    templateUrl: './boeking-editor.component.html',
    styleUrls: ['./boeking-editor.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class BoekingEditorComponent implements OnInit, OnDestroy {
    @Input() clubVliegtuigen: HeliosVliegtuigenDatasetExtended[];
    @Output() boekingToegevoegd: EventEmitter<void> = new EventEmitter<void>();

    @ViewChild(ModalComponent) private popup: ModalComponent;

    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];

    isSaving = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    lidID: number | undefined;
    vliegtuigID: number;
    opmerkingen: string;
    eersteDag: NgbDate | null;
    laatsteDag: NgbDate | null;

    constructor(private readonly ledenService: LedenService,
                private readonly reserveringenService: ReserveringService) {
    }

    ngOnInit(): void {
        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.leden = (leden) ? leden : [];
        });
    }

    ngOnDestroy(): void {
        if (this.ledenAbonnement) this.ledenAbonnement.unsubscribe();
    }

    // Openen van popup scherm
    openPopup() {
        this.popup.open();
    }

    // Aan wie wordt het vliegtuig toegekend
    lidGeselecteerd(id: number | undefined) {
        this.lidID = id;
    }

    // Voor welk vliegtuig gaan we de reservering toevoegen
    vliegtuigGeselecteerd(id: number) {
        this.vliegtuigID = id;
    }

    // is eerste datum eerder dan eind datum?
    vanTotOke(): boolean {
        if (this.eersteDag && this.laatsteDag) {
            const begin = this.eersteDag.year * 10000 + this.eersteDag.month * 100 + this.eersteDag.day;
            const eind = this.laatsteDag.year * 10000 + this.laatsteDag.month * 100 + this.laatsteDag.day;

            return (begin <= eind) ? true : false;
        }
        return false;
    }

    // als we niet aan de invoer condities voldoen, moet de invoerbutton uitgeschakeld zijn
    opslaanDisabled(): boolean {
        if (this.lidID && this.vliegtuigID && this.eersteDag && this.laatsteDag) {
            return !this.vanTotOke();
        }
        return false;
    }

    // controle & aanmaken van de reserveringen
    async aanmakenReserveringen() {
        if (this.eersteDag && this.laatsteDag) {
            this.isSaving = true;

            const beginDatum: DateTime = DateTime.fromObject({day: this.eersteDag.day, month: this.eersteDag.month, year: this.eersteDag.year});
            const eindDatum: DateTime = DateTime.fromObject({day: this.laatsteDag.day, month: this.laatsteDag.month, year: this.laatsteDag.year});

            const dataset = await this.reserveringenService.getReserveringen(beginDatum, eindDatum);    // opvragen reserveringen in deze periode
            const kist = this.clubVliegtuigen.find(v => v.ID == this.vliegtuigID)

            //controle of kist al gereseveerd is in deze periode
            for (let i = 0; i < dataset.length; i++) {
                if (dataset[i].VLIEGTUIG_ID == this.vliegtuigID) {

                    const d = DateTime.fromSQL(dataset[i].DATUM!);
                    const datum = d.day + "-" + d.month + "-" + d.year

                    this.error = { beschrijving: kist!.REG_CALL + " is op " + datum + " reeds gereserveerd" };
                    this.isSaving = false;
                    return;
                }
            }

            let datum: DateTime = DateTime.fromObject({day: this.eersteDag?.day, month: this.eersteDag?.month, year: this.eersteDag?.year});
            const eind: DateTime = DateTime.fromObject({day: this.laatsteDag?.day, month: this.laatsteDag?.month, year: this.laatsteDag?.year});

            const reservering: HeliosReservering = {
                IS_GEBOEKT: true,
                LID_ID: this.lidID,
                VLIEGTUIG_ID: this.vliegtuigID,
                OPMERKINGEN: this.opmerkingen
            }

            // Toevoegen van reserveringen door aanroepen API
            while (datum <= eind)
            {
                reservering.DATUM = datum.toISODate() as string;
                try {
                    await this.reserveringenService.addReservering(reservering);
                }
                catch (e) {
                    e.beschrijving += " " + datum.day + "-" + datum.month + "-" + datum.year;
                    this.error = e;
                }
                datum = datum.plus({days:1});
            }

            this.boekingToegevoegd.emit();
            this.isSaving = false;
            this.popup.close();
        }
    }
}
