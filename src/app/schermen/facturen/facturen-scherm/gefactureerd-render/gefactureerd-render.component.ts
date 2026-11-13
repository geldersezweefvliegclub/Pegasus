import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
    selector: 'app-gefactureerd-render',
    templateUrl: './gefactureerd-render.component.html',
    styleUrls: ['./gefactureerd-render.component.scss']
})
export class GefactureerdRenderComponent {
  // variablen in html formulier
  protected gridTekst: string | undefined

  agInit(params: ICellRendererParams): void {
    this.gridTekst = this.isGetal(params.value) ? "€ " + params.value.toLocaleString(undefined, {minimumFractionDigits: 2}) : params.data.value;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

  private isGetal(val: string | undefined): string
  {
    return (typeof val === 'number') ? "rechts" : "";
  }
}