import { Component } from '@angular/core';
import { LoginService } from '../../../services/apiservice/login.service';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-naam-render',
  templateUrl: './naam-render.component.html',
  styleUrls: ['./naam-render.component.scss']
})
export class NaamRenderComponent implements AgRendererComponent {
  naam: string;
  lidID: string;
  naarDashboard = false;

  constructor(private readonly loginService: LoginService) { }

  agInit(params: ICellRendererParams): void {
    const ui = this.loginService.userInfo?.Userinfo;

    this.naarDashboard = (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur) as boolean;
    this.naam = params.value;
    this.lidID = params.data.ID;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}






