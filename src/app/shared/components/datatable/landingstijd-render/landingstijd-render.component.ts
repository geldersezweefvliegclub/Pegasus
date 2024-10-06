import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { AgRendererComponent } from 'ag-grid-angular';
import {HeliosStartDataset} from "../../../../types/Helios";

export interface TijdButton {
  tijdClicked(data: HeliosStartDataset): void;
}

@Component({
  selector: 'app-landingstijd-render',
  templateUrl: './landingstijd-render.component.html',
  styleUrls: ['./landingstijd-render.component.scss']
})


export class LandingstijdRenderComponent implements AgRendererComponent {
  params: ICellRendererParams & TijdButton;
  landingsTijd: string;         // string met de tijd om te tonen
  toonButton = false;



  agInit(params: ICellRendererParams & TijdButton): void {
    this.params = params;
    this.landingsTijd = params.data.LANDINGSTIJD;
    this.toonButton = ((params.data.STARTTIJD) && (!params.data.LANDINGSTIJD))
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

  tijdClicked() {
    this.params.tijdClicked(this.params.data);
  }
}
