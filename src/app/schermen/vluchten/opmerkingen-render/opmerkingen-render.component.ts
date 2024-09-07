import { Component, OnInit } from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";
import {HeliosStartDataset} from "../../../types/Helios";

@Component({
  selector: 'app-opmerkingen-render',
  templateUrl: './opmerkingen-render.component.html',
  styleUrls: ['./opmerkingen-render.component.scss']
})
export class OpmerkingenRenderComponent implements AgRendererComponent  {

  opm: string;
  constructor() { }

  agInit(params: ICellRendererParams): void {
    this.opm = params.data.EXTERNAL_ID ? params.data.EXTERNAL_ID + ' ' : '';
    this.opm += params.data.OPMERKINGEN ? params.data.OPMERKINGEN : '';
  }
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}