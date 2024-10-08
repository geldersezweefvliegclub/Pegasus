import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';

export interface RestoreButton {
    onRestoreClicked(id: number): void;
}

@Component({
  selector: 'app-restore-action',
  templateUrl: './restore-action.component.html',
  styleUrls: ['./restore-action.component.scss']
})
export class RestoreActionComponent implements AgRendererComponent {
  private params: ICellRendererParams & RestoreButton;
  restoreIcon:IconDefinition = faUndo;

  agInit(params: ICellRendererParams & RestoreButton): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

  buttonClicked() {
    this.params.onRestoreClicked(this.params.data.ID);
  }
}
