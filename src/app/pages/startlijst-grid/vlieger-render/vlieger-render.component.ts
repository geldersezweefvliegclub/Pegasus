import {Component} from '@angular/core';
import {ICellRendererParams} from 'ag-grid-community';
import {AgRendererComponent} from 'ag-grid-angular';

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

    // Als de vlieger geen clublid is, dan is de naam handmatig ingevoerd
    agInit(params: ICellRendererParams): void {
        if (params.data.VLIEGERNAAM) {
            this.grid_vliegernaam = params.data.VLIEGERNAAM_LID + "(" + params.data.VLIEGERNAAM + ")"
        } else if (params.data.VLIEGERNAAM_LID) {
            this.grid_vliegernaam = params.data.VLIEGERNAAM_LID;
        } else {
            if (params.data.STARTTIJD) {
                this.error = true;    // Wel starttijd, geen vlieger bekend. PROBLEEM !!!
            } else {
                this.warning = true;  // Vlieger is nog niet beked, maar gelukkig is er nog niet gestart
            }
        }
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }

    // Waarschuwing als de vlieger niet is ingevuld
    cssWarningLevel(): string {
        if (this.error) {
            return "animate-flicker geenVliegerError";
        }

        return "geenVliegerWarning";
    }
}

