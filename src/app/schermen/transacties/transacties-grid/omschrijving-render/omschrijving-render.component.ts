import {Component} from '@angular/core';
import {ICellRendererParams} from "ag-grid-community";


@Component({
    selector: 'app-omschrijving-render',
    templateUrl: './omschrijving-render.component.html',
    styleUrls: ['./omschrijving-render.component.scss']
})
export class OmschrijvingRenderComponent {
    gridTekst: string | undefined

    constructor() {
    }

    agInit(params: ICellRendererParams): void {
        this.gridTekst = params.data.TYPE + " " + params.data.OMSCHRIJVING;
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}
