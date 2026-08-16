import { Component, inject } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { LoginService } from '../../../services/apiservice/login.service';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';


@Component({
    selector: 'app-inzittende-render',
    templateUrl: './achterin-render.component.html',
    styleUrls: ['./achterin-render.component.scss'],
    imports: [RouterLink, NgClass]
})

export class AchterinRenderComponent implements AgRendererComponent {
    private readonly loginService = inject(LoginService);

    grid_inzittendenaam: string;
    lidID: string;
    naarDashboard = false;

    warning = false;        // nog niet gestart, instructeur is onbekend
    error = false;

    // Als de inzittende geen clublid is, dan is de naam handmatig ingevoerd
    agInit(params: ICellRendererParams): void {
        if (params.data.PAX) {
            this.grid_inzittendenaam = params.data.INZITTENDENAAM
        }
        else if (params.data.INZITTENDENAAM) {
            if (params.data.VLIEGER_LIDTYPE_ID == 607) {
                this.grid_inzittendenaam = params.data.VLIEGERNAAM_LID + "(" + params.data.INZITTENDENAAM + ")"
            } else if (params.data.INZITTENDENAAM_LID) {
                this.grid_inzittendenaam = params.data.INZITTENDENAAM_LID + "(" + params.data.INZITTENDENAAM + ")"
            }
            else {
                this.grid_inzittendenaam = params.data.INZITTENDENAAM;
            }
        }
        else if (params.data.INZITTENDENAAM_LID) {
            const ui = this.loginService.userInfo;
            if (params.data.INZITTENDE_ID != ui?.LidData?.ID) {
                const ui = this.loginService.userInfo?.Userinfo;

                this.lidID = params.data.INZITTENDE_ID;
                this.naarDashboard = (this.lidID && (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur)) as boolean;
            }
            this.grid_inzittendenaam = params.data.INZITTENDENAAM_LID;
        }
        else if (params.data.INSTRUCTIEVLUCHT) {
            if (params.data.STARTTIJD) {
                this.error = true;    // Wel starttijd, geen instructeur bekend. PROBLEEM !!!
            } else if (params.data.VLIEGER_ID) {
                this.warning = true;  // Instructeur is nog niet bekend, maar gelukkig is er nog niet gestart
            }
        }
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}

