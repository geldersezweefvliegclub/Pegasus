import { Component, OnInit } from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";

@Component({
  selector: 'app-onderdruk-nul',
  templateUrl: './onderdruk-nul.component.html',
  styleUrls: ['./onderdruk-nul.component.scss']
})
export class OnderdrukNulComponent implements AgRendererComponent {

  waarde: number;

  constructor() {
  }

  agInit(params: ICellRendererParams): void {
    this.waarde = params.value;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
