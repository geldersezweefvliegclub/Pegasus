import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-zitplaats-render',
  templateUrl: './zitplaats-render.component.html',
  styleUrls: ['./zitplaats-render.component.scss']
})
export class ZitplaatsRenderComponent implements AgRendererComponent {
  stoelen: number;


  agInit(params: ICellRendererParams): void {
    this.stoelen = params.value;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
