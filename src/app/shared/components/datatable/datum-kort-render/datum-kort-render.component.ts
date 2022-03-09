import { Component } from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";

@Component({
  selector: 'app-datum-kort-render',
  templateUrl: './datum-kort-render.component.html',
  styleUrls: ['./datum-kort-render.component.scss']
})
export class DatumKortRenderComponent implements AgRendererComponent {
  public datum: string;

  constructor() {
  }

  agInit(params: ICellRendererParams): void {

    if (params.value) {
      const datePart = params.value.split('-');
      this.datum = datePart[2] + '-' + datePart[1];
    } else {
      this.datum = "";
    }
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
