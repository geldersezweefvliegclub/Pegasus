import {Component} from '@angular/core';
import {AgRendererComponent} from 'ag-grid-angular';
import {ICellRendererParams} from 'ag-grid-community';
import {SharedService} from '../../../../services/shared/shared.service';
import {PegasusDateFormat, PegasusDatePipe} from "../../../pipes/date/pegasus-date.pipe";

@Component({
  selector: 'app-datum-kort-render',
  templateUrl: './datum-kort-render.component.html',
  styleUrls: ['./datum-kort-render.component.scss']
})
export class DatumKortRenderComponent implements AgRendererComponent {
  public datum: string;

  constructor(private readonly sharedService: SharedService, private readonly pegasusDatePipe: PegasusDatePipe) {
  }

  agInit(params: ICellRendererParams): void {
    console.log("Als je dit ziet, moet deze regel getest worden!");
    this.datum = this.pegasusDatePipe.transform(params.value, PegasusDateFormat.DateTimeShort);
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
