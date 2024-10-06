import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { AgRendererComponent } from 'ag-grid-angular';
import { LoginService } from '../../../services/apiservice/login.service';


@Component({
    selector: 'app-vlieger-render',
    templateUrl: './voorin-render.component.html',
    styleUrls: ['./voorin-render.component.scss']
})
export class VoorinRenderComponent implements AgRendererComponent {
    lidID: string;
    grid_vliegernaam: string;
    naarDashboard = false;

    error = false;          // er is gestart, maar PIC is onbekend

    constructor(private readonly loginService: LoginService) { }

    // Als de vlieger geen clublid is, dan is de naam handmatig ingevoerd
    agInit(params: ICellRendererParams): void {
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

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}

