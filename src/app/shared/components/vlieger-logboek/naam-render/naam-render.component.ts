import {Component} from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {LoginService} from "../../../../services/apiservice/login.service";
import {ICellRendererParams} from "ag-grid-community";

@Component({
    selector: 'app-naam-render',
    templateUrl: './naam-render.component.html',
    styleUrls: ['./naam-render.component.scss']
})
export class NaamRenderComponent implements AgRendererComponent {
    naam: string;
    lidID: string;
    naarDashboard: boolean = false;

    constructor(private readonly loginService: LoginService) {
    }

    agInit(params: ICellRendererParams): void {
        this.naam = params.value;
        const ui = this.loginService.userInfo;

        // We gebruiken de render de naam van de vlieger of inzittende, maar wie is het?
        if (this.naam == params.data.VLIEGERNAAM) { // de vlieger
            if (params.data.VLIEGER_ID != ui?.LidData?.ID) {
                this.lidID = params.data.VLIEGER_ID;

                const ui = this.loginService.userInfo?.Userinfo;
                this.naarDashboard = (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur) as boolean;
            }
        } else {  // de inzittende
            if (params.data.INZITTENDE_ID != ui?.LidData?.ID) {
                this.lidID = params.data.INZITTENDE_ID;

                const ui = this.loginService.userInfo?.Userinfo;
                this.naarDashboard = (this.lidID && (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur)) as boolean;
            }
        }
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}

