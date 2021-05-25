import {Component, OnInit} from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";

@Component({
    selector: 'app-checkbox-render',
    templateUrl: './checkbox-render.component.html',
    styleUrls: ['./checkbox-render.component.scss']
})
export class CheckboxRenderComponent implements AgRendererComponent {
    private boolWaarde: boolean = false;

    constructor() {
    }

    agInit(params: ICellRendererParams): void {
        if ((params.value === 1) || (params.value === "1") || (params.value == true)) {
            this.boolWaarde = true;
        }
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }

}
