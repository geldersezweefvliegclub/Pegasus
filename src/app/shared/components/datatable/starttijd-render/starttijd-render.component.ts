import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { AgRendererComponent } from 'ag-grid-angular';
import {HeliosStartDataset} from "../../../../types/Helios";

export interface TijdButton {
  tijdClicked(data: HeliosStartDataset): void;
}

@Component({
  selector: 'app-starttijd-render',
  templateUrl: './starttijd-render.component.html',
  styleUrls: ['./starttijd-render.component.scss']
})

export class StarttijdRenderComponent implements AgRendererComponent {
  params: ICellRendererParams & TijdButton;
  startTijd: string;         // string met de tijd om te tonen

  agInit(params: ICellRendererParams & TijdButton): void {
      this.params = params;
      this.startTijd = params.data.STARTTIJD;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

  tijdClicked() {
    this.params.tijdClicked(this.params.data);
  }
}
