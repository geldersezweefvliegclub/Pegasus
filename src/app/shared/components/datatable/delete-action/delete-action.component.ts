import {Component} from '@angular/core';
import {AgRendererComponent} from 'ag-grid-angular';
import {ICellRendererParams} from 'ag-grid-community';
import {faMinusCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-delete-action',
    templateUrl: './delete-action.component.html',
    styleUrls: ['./delete-action.component.scss']
})
export class DeleteActionComponent implements AgRendererComponent {
    private params: any;
    deleteIcon = faMinusCircle;

    constructor() {
    }

    agInit(params: ICellRendererParams): void {
        this.params = params;
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }

    buttonClicked() {
        this.params.onDeleteClicked(this.params.data.ID);
    }
}
