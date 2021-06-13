import { Component, OnInit } from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";

@Component({
  selector: 'app-inzittende-render',
  templateUrl: './inzittende-render.component.html',
  styleUrls: ['./inzittende-render.component.scss']
})

export class InzittendeRenderComponent implements AgRendererComponent {
  grid_inzittendenaam: string;

  constructor() {
  }

  agInit(params: ICellRendererParams): void {
    if (params.data.INZITTENDENAAM) {
      this.grid_inzittendenaam = params.data.INZITTENDERNAAM
    } else {
      this.grid_inzittendenaam = params.data.INZITTENDENAAM_LID;
    }
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}

