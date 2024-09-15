import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { GastenService } from '../../../../../services/apiservice/gasten.service';
import { DateTime } from 'luxon';
import { HeliosGastenDataset } from '../../../../../types/Helios';

@Component({
    selector: 'app-gast-invoer',
    templateUrl: './gast-invoer.component.html',
    styleUrls: ['./gast-invoer.component.scss']
})
export class GastInvoerComponent implements OnInit, OnChanges {
    @Input() DATUM: DateTime;
    @Output() gast:EventEmitter<string> = new EventEmitter<string>();
    @Output() opmerking:EventEmitter<string> = new EventEmitter<string>();

    gasten: HeliosGastenDataset[] = [];

    constructor(private readonly gastenService: GastenService) {
    }

    ngOnInit(): void {
        this.opvragen();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (Object.prototype.hasOwnProperty.call(changes, "DATUM")) {
            this.opvragen();
        }
    }

    private opvragen() {
        this.gastenService.getGasten(false, this.DATUM, this.DATUM).then((gasten) => {
            this.gasten = gasten;
        });
    }

    gastGeselecteerd(id: number) {
        const idx = this.gasten.findIndex(g => g.ID == id);

        if (idx != -1) {
            this.gast.emit(this.gasten[idx].NAAM);
            this.opmerking.emit(this.gasten[idx].OPMERKINGEN);
        }
    }
}
