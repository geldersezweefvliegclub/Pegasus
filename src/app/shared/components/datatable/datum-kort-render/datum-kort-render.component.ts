import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { SharedService } from '../../../../services/shared/shared.service';

@Component({
  selector: 'app-datum-kort-render',
  templateUrl: './datum-kort-render.component.html',
  styleUrls: ['./datum-kort-render.component.scss']
})
export class DatumKortRenderComponent implements AgRendererComponent {
  public datum: string;

  constructor(private readonly sharedService: SharedService) {
  }

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
