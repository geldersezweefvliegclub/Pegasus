import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  selector: 'app-icon-render',
  templateUrl: './icon-render.component.html',
  styleUrls: ['./icon-render.component.scss']
})
export class IconRenderComponent implements AgRendererComponent {
  toonPax = false;
  toonCheckStart = false;
  toonInstructieVlucht = false;

  agInit(params: ICellRendererParams): void {
    this.toonPax = params.data.PAX;
    this.toonCheckStart = params.data.CHECKSTART;
    this.toonInstructieVlucht = params.data.INSTRUCTIEVLUCHT;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
