import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-handboek-render',
  templateUrl: './handboek-render.component.html',
  styleUrls: ['./handboek-render.component.scss']
})
export class HandboekRenderComponent implements AgRendererComponent {
  url: string | undefined;
  txt: string | undefined;


  agInit(params: ICellRendererParams): void {
    this.url = (params.data.URL) ? params.data.URL : '';
    this.txt = params.value;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
