import { Component, OnChanges, OnInit, SimpleChanges, inject, input, output } from '@angular/core';
import { GastenService } from '../../../../../services/apiservice/gasten.service';
import { DateTime } from 'luxon';
import { HeliosGastenDataset } from '../../../../../types/Helios';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-gast-invoer',
    templateUrl: './gast-invoer.component.html',
    styleUrls: ['./gast-invoer.component.scss'],
    imports: [FormsModule]
})
export class GastInvoerComponent implements OnInit, OnChanges {
    private readonly gastenService = inject(GastenService);

    readonly DATUM = input.required<DateTime>();
    readonly gast = output<string>();
    readonly opmerking = output<string>();

    gasten: HeliosGastenDataset[] = [];

    ngOnInit(): void {
        this.opvragen();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (Object.prototype.hasOwnProperty.call(changes, "DATUM")) {
            this.opvragen();
        }
    }

    private opvragen() {
        this.gastenService.getGasten(false, this.DATUM(), this.DATUM()).then((gasten) => {
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
