import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
    selector: 'app-status-render',
    templateUrl: './status-render.component.html',
    styleUrls: ['./status-render.component.scss']
})

export class StatusRenderComponent implements AgRendererComponent {
    // variablen in html formulier
    protected status: string | undefined;
    protected id: number | undefined;

    agInit(params: ICellRendererParams): void {
        this.status = params.data.STATUS;
        this.id = params.data.STATUS_ID;
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}
