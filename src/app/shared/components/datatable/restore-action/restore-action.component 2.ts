import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

export interface RestoreButton {
    onRestoreClicked(id: number): void;
}

@Component({
    selector: 'app-restore-action',
    templateUrl: './restore-action.component.html',
    styleUrls: ['./restore-action.component.scss'],
    imports: [FaIconComponent]
})
export class RestoreActionComponent implements AgRendererComponent {
  // variablen in html formulier
  protected restoreIcon:IconDefinition = faUndo;

  // private variable voor ts script
  private params: ICellRendererParams & RestoreButton;

  agInit(params: ICellRendererParams & RestoreButton): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

  protected buttonClicked() {
    this.params.onRestoreClicked(this.params.data.ID);
  }
}
