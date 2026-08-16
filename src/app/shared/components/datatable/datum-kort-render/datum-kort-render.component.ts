import { Component, inject } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { SharedService } from '../../../../services/shared/shared.service';

@Component({
    selector: 'app-datum-kort-render',
    templateUrl: './datum-kort-render.component.html',
    styleUrls: ['./datum-kort-render.component.scss']
})
export class DatumKortRenderComponent implements AgRendererComponent {
  private readonly sharedService = inject(SharedService);

  public datum: string;

  agInit(params: ICellRendererParams): void {

    if (params.value) {
      this.datum = this.sharedService.datumDM(params.value)
    } else {
      this.datum = "";
    }
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
