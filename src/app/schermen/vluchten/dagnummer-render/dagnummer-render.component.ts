import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-dagnummer-render',
  templateUrl: './dagnummer-render.component.html',
  styleUrls: ['./dagnummer-render.component.scss']
})
export class DagnummerRenderComponent implements AgRendererComponent {
  params: ICellRendererParams;
  dagnummer: number;
  hasFlarm = false;



  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.dagnummer = params.data.DAGNUMMER;
    this.hasFlarm = params.data.hasFlarm;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

}
