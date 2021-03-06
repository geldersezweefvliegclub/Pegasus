import {Component} from '@angular/core';
import {ICellRendererParams} from 'ag-grid-community';
import {AgRendererComponent} from 'ag-grid-angular';
import {LoginService} from "../../../services/apiservice/login.service";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";


@Component({
    selector: 'app-vlieger-render',
    templateUrl: './voorin-render.component.html',
    styleUrls: ['./voorin-render.component.scss']
})
export class VoorinRenderComponent implements AgRendererComponent {
    warningIcon:IconDefinition = faExclamationTriangle;
    lidID: string;
    grid_vliegernaam: string;
    naarDashboard: boolean = false;

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

