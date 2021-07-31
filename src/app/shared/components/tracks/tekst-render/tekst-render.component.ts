import { Component, OnInit } from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faFileAlt} from "@fortawesome/free-solid-svg-icons";
import {ICellRendererParams} from "ag-grid-community";
import {DateTime} from "luxon";

@Component({
  selector: 'app-tekst-render',
  templateUrl: './tekst-render.component.html',
  styleUrls: ['./tekst-render.component.scss']
})
export class TekstRenderComponent implements AgRendererComponent {
  private params: any;
  datum: string;
  tijd: string;

  constructor() {
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;

    const datumtijd = DateTime.fromSQL(params.data.INGEVOERD);
    this.datum = datumtijd.day + "-" + datumtijd.month + "-" + datumtijd.year;
    this.tijd = datumtijd.toFormat("HH:mm")


  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
