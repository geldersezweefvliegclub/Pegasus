import {Component} from '@angular/core';
import {ICellRendererParams} from 'ag-grid-community';
import {AgRendererComponent} from 'ag-grid-angular';

@Component({
  selector: 'app-starttijd-render',
  templateUrl: './starttijd-render.component.html',
  styleUrls: ['./starttijd-render.component.scss']
})


export class StarttijdRenderComponent implements AgRendererComponent {
  params: any;
  startTijd: string;         // string met de tijd om te tonen

  constructor() {
  }

  agInit(params: ICellRendererParams): void {
      this.params = params;
      this.startTijd = params.data.STARTTIJD;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  tijdClicked() {
    this.params.tijdClicked(this.params.data);
  }
}
