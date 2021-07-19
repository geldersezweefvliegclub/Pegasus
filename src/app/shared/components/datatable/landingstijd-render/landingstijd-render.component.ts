import {Component} from '@angular/core';
import {ICellRendererParams} from 'ag-grid-community';
import {AgRendererComponent} from 'ag-grid-angular';

@Component({
  selector: 'app-landingstijd-render',
  templateUrl: './landingstijd-render.component.html',
  styleUrls: ['./landingstijd-render.component.scss']
})


export class LandingstijdRenderComponent implements AgRendererComponent {
  private params: any;
  landingsTijd: string;         // string met de tijd om te tonen
  toonButton: boolean = false;

  constructor() {
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.landingsTijd = params.data.LANDINGSTIJD;
    this.toonButton = ((params.data.STARTTIJD) && (!params.data.LANDINGSTIJD))
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  tijdClicked() {
    this.params.tijdClicked(this.params.data);
  }
}
