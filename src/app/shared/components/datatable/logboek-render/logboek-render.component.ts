import { Component } from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {faFileAlt} from "@fortawesome/free-solid-svg-icons";
import {ICellRendererParams} from "ag-grid-community";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";

@Component({
  selector: 'app-logboek-render',
  templateUrl: './logboek-render.component.html',
  styleUrls: ['./logboek-render.component.scss']
})
export class LogboekRenderComponent implements AgRendererComponent {
  private params: any;
  logboekIcon:IconDefinition = faFileAlt;

  constructor() {
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  buttonClicked() {
    this.params.onLogboekClicked(this.params.data.ID);
  }
}
