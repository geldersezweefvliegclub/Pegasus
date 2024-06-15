import { Component, OnInit } from '@angular/core';
import {ICellRendererParams} from "ag-grid-community";

@Component({
  selector: 'app-leeftijd-render',
  templateUrl: './leeftijd-render.component.html',
  styleUrls: ['./leeftijd-render.component.scss']
})
export class LeeftijdRenderComponent {
  value: string
  controleNodig: boolean

  constructor() {
  }

  agInit(params: ICellRendererParams): void {
    this.value = params.value
    this.controleNodig = (params.data.LIDTYPE_ID == 603 && params.data.LEEFTIJD > 18) ? true : false
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}