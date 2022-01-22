import {Component} from '@angular/core';
import {AgRendererComponent} from 'ag-grid-angular';
import {ICellRendererParams} from 'ag-grid-community';
import {LoginService} from "../../../services/apiservice/login.service";

@Component({
  selector: 'app-inzittende-render',
  templateUrl: './inzittende-render.component.html',
  styleUrls: ['./inzittende-render.component.scss']
})

export class InzittendeRenderComponent implements AgRendererComponent {
  grid_inzittendenaam: string;
  lidID: string;
  naarDashboard: boolean = false;

  constructor(private readonly loginService: LoginService) { }

  // Als de inzittende geen clublid is, dan is de naam handmatig ingevoerd
  agInit(params: ICellRendererParams): void {
    if (params.data.INZITTENDENAAM) {
      this.grid_inzittendenaam = params.data.INZITTENDENAAM
    } else {
      const ui = this.loginService.userInfo;
      if (params.data.INZITTENDE_ID != ui?.LidData?.ID)
      {
        const ui = this.loginService.userInfo?.Userinfo;

        this.lidID = params.data.INZITTENDE_ID;
        this.naarDashboard = (this.lidID && (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur)) as boolean;
      }
      this.grid_inzittendenaam = params.data.INZITTENDENAAM_LID;
    }
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}

