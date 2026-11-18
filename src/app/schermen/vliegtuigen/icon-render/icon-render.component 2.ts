import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { faBug, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { ICellRendererParams } from 'ag-grid-community';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

interface ButtonClicked {
    onLogboekClicked(ID: number): void;
    onJournaalClicked(ID: number): void;
}
@Component({
    selector: 'app-icon-render',
    templateUrl: './icon-render.component.html',
    styleUrls: ['./icon-render.component.scss'],
    imports: [FaIconComponent]
})
export class IconRenderComponent implements AgRendererComponent {
    // variablen in html formulier
    protected params: ICellRendererParams & ButtonClicked;
    protected logboekIcon: IconDefinition = faFileAlt;
    protected journaalIcon: IconDefinition = faBug;

    agInit(params: ICellRendererParams & ButtonClicked): void {
        this.params = params;
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }

    protected logboekButtonClicked() {
        this.params.onLogboekClicked(this.params.data.ID);
    }

    protected journaalButtonClicked() {
        this.params.onJournaalClicked(this.params.data.ID);
    }
}
