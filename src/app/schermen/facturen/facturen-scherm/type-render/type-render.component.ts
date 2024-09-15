import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-type-render',
  templateUrl: './type-render.component.html',
  styleUrls: ['./type-render.component.scss']
})
export class TypeRenderComponent  {
  gridTekst: string | undefined
  value: string

  constructor() {
  }

  agInit(params: ICellRendererParams): void {
    this.value = params.value
    this.gridTekst = this.isGetal(params.value) ? "€ " + params.value.toLocaleString( undefined, { minimumFractionDigits: 2 }) : params.value;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  isGetal(val: string | undefined): string
  {
    return (typeof val === 'number') ? "rechts" : "";
  }
}
