import {Component} from '@angular/core';
import {ICellRendererParams} from 'ag-grid-community';
import {AgRendererComponent} from 'ag-grid-angular';

@Component({
  selector: 'app-adres-render',
  templateUrl: './adres-render.component.html',
  styleUrls: ['./adres-render.component.scss']
})
export class AdresRenderComponent implements AgRendererComponent {
  regel1: string;
  regel2: string;

  constructor() { }

  agInit(params: ICellRendererParams): void {
    this.regel1 = params.data.ADRES;
    this.regel2 = params.data.POSTCODE;

    // Als postcode aanwezig is dan spatie tussen postcode en woonplaats
    if (this.regel2) {
      this.regel2 += " ";
    }

    if (params.data.WOONPLAATS) {
      this.regel2 += params.data.WOONPLAATS;
    }

    // verwijder eventuele spatie aan het einde (als er geen woonplaats is)
    if (this.regel2) {
      this.regel2 = this.regel2.trim();
    }
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
