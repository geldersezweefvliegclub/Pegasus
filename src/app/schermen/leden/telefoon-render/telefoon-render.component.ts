import {Component} from '@angular/core';
import {AgRendererComponent} from 'ag-grid-angular';
import {ICellRendererParams} from 'ag-grid-community';

@Component({
  selector: 'app-telefoon-render',
  templateUrl: './telefoon-render.component.html',
  styleUrls: ['./telefoon-render.component.scss']
})
export class TelefoonRenderComponent implements AgRendererComponent {
  telefoon: string;
  mobiel: string;
  noodnummer: string;

  constructor() { }

  agInit(params: ICellRendererParams): void {
    this.telefoon = params.data.TELEFOON;
    this.mobiel = params.data.MOBIEL;
    this.noodnummer = params.data.NOODNUMMER;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
