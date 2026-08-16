import { Component, inject } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { SharedService } from '../../../../services/shared/shared.service';

@Component({
    selector: 'app-datum-render',
    templateUrl: './datum-render.component.html',
    styleUrls: ['./datum-render.component.scss']
})
export class DatumRenderComponent implements AgRendererComponent {
    private readonly sharedService = inject(SharedService);

    public datum: string;

    agInit(params: ICellRendererParams): void {

        if (params.value) {
            this.datum = this.sharedService.datumDMJ(params.value);
        } else {
            this.datum = "";
        }
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}
