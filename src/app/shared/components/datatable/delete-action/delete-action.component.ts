import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';

export interface DeleteButton {
    onDeleteClicked(id: number): void;
}

@Component({
    selector: 'app-delete-action',
    templateUrl: './delete-action.component.html',
    styleUrls: ['./delete-action.component.scss']
})
export class DeleteActionComponent implements AgRendererComponent {
    private params: ICellRendererParams & DeleteButton;
    deleteIcon:IconDefinition = faMinusCircle;

    agInit(params: ICellRendererParams & DeleteButton): void {
        this.params = params;
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }

    buttonClicked() {
        this.params.onDeleteClicked(this.params.data.ID);
    }
}
