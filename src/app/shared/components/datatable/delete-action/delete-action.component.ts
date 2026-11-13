import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

export interface DeleteButton {
    onDeleteClicked(id: number): void;
}

@Component({
    selector: 'app-delete-action',
    templateUrl: './delete-action.component.html',
    styleUrls: ['./delete-action.component.scss'],
    imports: [FaIconComponent]
})
export class DeleteActionComponent implements AgRendererComponent {
    // variablen in html formulier
    protected deleteIcon:IconDefinition = faMinusCircle;

    // private variable voor ts script
    private params: ICellRendererParams & DeleteButton;

    agInit(params: ICellRendererParams & DeleteButton): void {
        this.params = params;
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }

    protected buttonClicked() {
        this.params.onDeleteClicked(this.params.data.ID);
    }
}
