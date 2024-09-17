import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-restore-action',
  templateUrl: './restore-action.component.html',
  styleUrls: ['./restore-action.component.scss']
})
export class RestoreActionComponent implements AgRendererComponent {
  private params: ICellRendererParams;
  restoreIcon:IconDefinition = faUndo;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

  buttonClicked() {
    this.params.context.onRestoreClicked(this.params.data.ID);
  }
}
