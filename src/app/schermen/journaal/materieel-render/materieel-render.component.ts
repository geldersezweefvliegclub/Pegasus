import {Component} from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";

@Component({
    selector: 'app-materieel-render',
    templateUrl: './materieel-render.component.html',
    styleUrls: ['./materieel-render.component.scss']
})
export class MaterieelRenderComponent implements AgRendererComponent {
    tekst: string | undefined;

    constructor() {
    }

    agInit(params: ICellRendererParams): void {
        this.tekst = (params.data.ROLLEND_ID) ? params.data.ROLLEND : params.data.REG_CALL ;
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}
