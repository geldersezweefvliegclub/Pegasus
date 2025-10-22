import {Component} from '@angular/core';
import {ICellRendererParams} from 'ag-grid-community';
import {AgRendererComponent} from 'ag-grid-angular';
import {PegasusDateFormat, PegasusDatePipe} from "../../../pipes/date/pegasus-date.pipe";

@Component({
    selector: 'app-datumtijd-render',
    templateUrl: './datumtijd-render.component.html',
    styleUrls: ['./datumtijd-render.component.scss']
})
export class DatumtijdRenderComponent implements AgRendererComponent{
    public datumtijd: string;

    constructor(private readonly dateFormatter: PegasusDatePipe) {
    }

    agInit(params: ICellRendererParams): void {
        this.datumtijd = this.dateFormatter.transform(params.value,  PegasusDateFormat.DateTimeShort)
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}
