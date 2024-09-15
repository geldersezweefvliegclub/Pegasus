import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { AgRendererComponent } from 'ag-grid-angular';

@Component({
  selector: 'app-type-render',
  templateUrl: './type-render.component.html',
  styleUrls: ['./type-render.component.scss']
})
export class TypeRenderComponent implements AgRendererComponent {
  gridTekst: string | undefined
  value: string

  agInit(params: ICellRendererParams): void {
    this.value = params.value
    this.gridTekst = this.isGetal(params.value) ? "€ " + params.value.toLocaleString( undefined, { minimumFractionDigits: 2 }) : params.value;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

  // todo: bijzonder. Type is string | undefined, maar toch wordt gecheckt op typeof val === 'number'? Dus val kan ook een nummer zijn, of die check is niet nodig
  isGetal(val: string | undefined): string {
    return (typeof val === 'number') ? "rechts" : "";
  }
}
