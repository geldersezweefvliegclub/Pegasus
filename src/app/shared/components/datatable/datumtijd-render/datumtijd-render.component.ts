import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { SharedService } from '../../../../services/shared/shared.service';
import { AgRendererComponent } from 'ag-grid-angular';

@Component({
    selector: 'app-datumtijd-render',
    templateUrl: './datumtijd-render.component.html',
    styleUrls: ['./datumtijd-render.component.scss']
})
export class DatumtijdRenderComponent implements AgRendererComponent{
    public datumtijd: string;

    constructor(private readonly sharedService: SharedService) {
    }

    agInit(params: ICellRendererParams): void {

        if (params.value) {
            const datetimePart = params.value.split(' ');
            this.datumtijd = this.sharedService.datumDMJ(datetimePart[0]) + " " + datetimePart[1];
        } else {
            this.datumtijd = "";
        }
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}
