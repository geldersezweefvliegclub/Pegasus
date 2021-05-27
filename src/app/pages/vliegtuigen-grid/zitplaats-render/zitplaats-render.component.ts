import {Component} from '@angular/core';
import {AgRendererComponent} from 'ag-grid-angular';
import {ICellRendererParams} from 'ag-grid-community';

@Component({
  selector: 'app-zitplaats-render',
  templateUrl: './zitplaats-render.component.html',
  styleUrls: ['./zitplaats-render.component.scss']
})
export class ZitplaatsRenderComponent implements AgRendererComponent {
  private stoelen: string;
  constructor() { }

  agInit(params: ICellRendererParams): void {
    this.stoelen = params.value;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }


}
