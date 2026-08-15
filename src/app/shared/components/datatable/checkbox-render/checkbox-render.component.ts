import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-checkbox-render',
    templateUrl: './checkbox-render.component.html',
    styleUrls: ['./checkbox-render.component.scss'],
    imports: [FaIconComponent]
})
export class CheckboxRenderComponent implements AgRendererComponent {
  boolWaarde = false;
  check = faCheck;
  cross = faTimes;



  agInit(params: ICellRendererParams): void {
    if ((params.value === 1) || (params.value === '1') || (params.value == true)) {
      this.boolWaarde = true;
    }
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

}
