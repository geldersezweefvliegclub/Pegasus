import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { faBug, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { ICellRendererParams } from 'ag-grid-community';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';

@Component({
    selector: 'app-icon-render',
    templateUrl: './icon-render.component.html',
    styleUrls: ['./icon-render.component.scss']
})
export class IconRenderComponent implements AgRendererComponent {
    params: ICellRendererParams;
    logboekIcon: IconDefinition = faFileAlt;
    journaalIcon: IconDefinition = faBug;



    agInit(params: ICellRendererParams): void {
        this.params = params;
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }

    logbooekButtonClicked() {
        this.params.context.onLogboekClicked(this.params.data.ID);
    }

    journaalButtonClicked() {
        this.params.context.onJournaalClicked(this.params.data.ID);
    }
}
