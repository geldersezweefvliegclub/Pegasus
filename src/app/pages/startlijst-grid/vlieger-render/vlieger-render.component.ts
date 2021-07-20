import {Component} from '@angular/core';
import {ICellRendererParams} from 'ag-grid-community';
import {AgRendererComponent} from 'ag-grid-angular';
import {LoginService} from "../../../services/apiservice/login.service";

@Component({
    selector: 'app-vlieger-render',
    templateUrl: './vlieger-render.component.html',
    styleUrls: ['./vlieger-render.component.scss']
})
export class VliegerRenderComponent implements AgRendererComponent {
    warningIcon = "ExclamationTriangle"
    lidID: string;
    grid_vliegernaam: string;
    naarDashboard: boolean = false;

    warning: boolean = false;        // nog niet gestart, PIC is onbekend
    error: boolean = false;          // er is gestart, maar PIC is onbekend

    constructor(private readonly loginService: LoginService) { }

    // Als de vlieger geen clublid is, dan is de naam handmatig ingevoerd
    agInit(params: ICellRendererParams): void {
        const ui = this.loginService.userInfo?.Userinfo;

        if (params.data.VLIEGERNAAM) {
            this.grid_vliegernaam = params.data.VLIEGERNAAM_LID + "(" + params.data.VLIEGERNAAM + ")"
        } else if (params.data.VLIEGERNAAM_LID) {
            const ui = this.loginService.userInfo;
            if (params.data.VLIEGER_ID != ui?.LidData?.ID)
            {
                const ui = this.loginService.userInfo?.Userinfo;

                this.lidID = params.data.VLIEGER_ID;
                this.naarDashboard = (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur) as boolean;
            }
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

