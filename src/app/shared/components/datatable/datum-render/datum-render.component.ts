import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { SharedService } from '../../../../services/shared/shared.service';

@Component({
    selector: 'app-datum-render',
    templateUrl: './datum-render.component.html',
    styleUrls: ['./datum-render.component.scss']
})
export class DatumRenderComponent implements AgRendererComponent {
    public datum: string;

    agInit(params: ICellRendererParams): void {
        this.datum = params.value;
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}
