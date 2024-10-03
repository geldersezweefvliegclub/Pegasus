import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { faBug, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { ICellRendererParams } from 'ag-grid-community';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';

interface ButtonClicked {
    onLogboekClicked(ID: number): void;
    onJournaalClicked(ID: number): void;
}
@Component({
    selector: 'app-icon-render',
    templateUrl: './icon-render.component.html',
    styleUrls: ['./icon-render.component.scss']
})
export class IconRenderComponent implements AgRendererComponent {
    params: ICellRendererParams & ButtonClicked;
    logboekIcon: IconDefinition = faFileAlt;
    journaalIcon: IconDefinition = faBug;

    agInit(params: ICellRendererParams & ButtonClicked): void {
        this.params = params;
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }

    logboekButtonClicked() {
        this.params.onLogboekClicked(this.params.data.ID);
    }

    journaalButtonClicked() {
        this.params.onJournaalClicked(this.params.data.ID);
    }
}
