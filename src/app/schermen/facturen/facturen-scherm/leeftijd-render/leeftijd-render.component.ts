import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { AgRendererComponent } from 'ag-grid-angular';

@Component({
  selector: 'app-leeftijd-render',
  templateUrl: './leeftijd-render.component.html',
  styleUrls: ['./leeftijd-render.component.scss']
})
export class LeeftijdRenderComponent implements AgRendererComponent {
  value: string;
  controleNodig: boolean;

  agInit(params: ICellRendererParams): void {
    this.value = params.value;
    this.controleNodig = ((params.data.LIDTYPE_ID == 600) || (params.data.LIDTYPE_ID == 603 && params.data.LEEFTIJD >= 21));
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}