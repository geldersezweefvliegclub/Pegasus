import {Component, EventEmitter, Output} from '@angular/core';
import {AgRendererComponent} from 'ag-grid-angular';
import {ICellRendererParams} from 'ag-grid-community';
import {faUndo} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-restore-action',
  templateUrl: './restore-action.component.html',
  styleUrls: ['./restore-action.component.scss']
})
export class RestoreActionComponent implements AgRendererComponent {
  private params: any;
  restoreIcon = faUndo;

  constructor() {
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  buttonClicked() {
    this.params.onRestoreClicked(this.params.value);
  }
}
