import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-title-render',
  templateUrl: './title-render.component.html',
  styleUrls: ['./title-render.component.scss']
})
export class TitleRenderComponent implements AgRendererComponent {
  omschrijving: string
  titel: string



  agInit(params: ICellRendererParams): void {
    this.omschrijving = params.data.OMSCHRIJVING;
    this.titel = params.data.TITEL
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

}
