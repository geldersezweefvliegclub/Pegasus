import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { AgRendererComponent } from 'ag-grid-angular';


@Component({
    selector: 'app-omschrijving-render',
    templateUrl: './omschrijving-render.component.html',
    styleUrls: ['./omschrijving-render.component.scss']
})
export class OmschrijvingRenderComponent implements AgRendererComponent{
    gridTekst: string | undefined

    agInit(params: ICellRendererParams): void {
        this.gridTekst = params.data.TYPE + " " + params.data.OMSCHRIJVING;
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}
