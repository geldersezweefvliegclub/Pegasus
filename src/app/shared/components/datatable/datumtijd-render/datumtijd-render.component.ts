import { Component, inject } from '@angular/core';
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

    // private variable voor ts script
    private readonly sharedService = inject(SharedService);

    agInit(params: ICellRendererParams): void {

        this.datumtijd = (params.value) ? this.sharedService.datumTijdDMJ(params.value) : "";
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}
