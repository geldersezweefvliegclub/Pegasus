import { Component, inject } from '@angular/core';
import { LoginService } from '../../../services/apiservice/login.service';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-naam-render',
    templateUrl: './naam-render.component.html',
    styleUrls: ['./naam-render.component.scss'],
    imports: [RouterLink]
})
export class NaamRenderComponent implements AgRendererComponent {
  // variablen in html formulier
  protected naam: string;
  protected lidID: string;
  protected naarDashboard = false;

  // private variable voor ts script
  private readonly loginService = inject(LoginService);

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

