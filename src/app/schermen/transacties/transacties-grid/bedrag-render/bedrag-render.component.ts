import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { AgRendererComponent } from 'ag-grid-angular';
import { NgClass, DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-bedrag-render',
    templateUrl: './bedrag-render.component.html',
    styleUrls: ['./bedrag-render.component.scss'],
    imports: [NgClass, DecimalPipe]
})
export class BedragRenderComponent implements AgRendererComponent {
    bedrag: number | undefined;
    betaald: boolean | undefined;

    agInit(params: ICellRendererParams): void {
        this.bedrag = params.value;
        this.betaald = params.data.BETAALD;
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}
