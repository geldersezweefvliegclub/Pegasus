import {Component} from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";

@Component({
    selector: 'app-datum-render',
    templateUrl: './datum-render.component.html',
    styleUrls: ['./datum-render.component.scss']
})
export class DatumRenderComponent implements AgRendererComponent {
    datum: string;

    constructor() {
    }

    agInit(params: ICellRendererParams): void {

        if (params.value) {
            const datePart = params.value.split('-');
            this.datum = datePart[2] + '-' + datePart[1] + '-' + datePart[0];
        } else {
            this.datum = "";
        }
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}