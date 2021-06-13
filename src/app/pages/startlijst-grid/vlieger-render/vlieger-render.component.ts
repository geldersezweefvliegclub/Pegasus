import {Component, OnInit} from '@angular/core';
import {ICellRendererParams} from "ag-grid-community";
import {AgRendererComponent} from "ag-grid-angular";
import {NgbDate} from "@ng-bootstrap/ng-bootstrap";
import {DateTime} from "luxon";

@Component({
    selector: 'app-vlieger-render',
    templateUrl: './vlieger-render.component.html',
    styleUrls: ['./vlieger-render.component.scss']
})
export class VliegerRenderComponent implements AgRendererComponent {
    warningIcon = "ExclamationTriangle"
    grid_vliegernaam: string;
    warning: boolean = false;        // nog niet gestart, PIC is onbekend
    error: boolean = false;          // er is gestart, maar PIC is onbekend

    constructor() {
    }

    agInit(params: ICellRendererParams): void {
        if (params.data.VLIEGERNAAM) {
            this.grid_vliegernaam = params.data.VLIEGERNAAM_LID + "(" + params.data.VLIEGERNAAM + ")"
        } else if (params.data.VLIEGERNAAM_LID) {
            this.grid_vliegernaam = params.data.VLIEGERNAAM_LID;
        } else {
            if (params.data.STARTTIJD) {
                this.error = true;
            } else {
                this.warning = true;
            }
        }
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }

    cssWarningLevel(): string {
        if (this.error) {
            return "animate-flicker geenVliegerError";
        }

        return "geenVliegerWarning";
    }
}

