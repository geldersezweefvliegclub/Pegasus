import {Component, Input} from '@angular/core';
import {GridApi, GridOptions} from 'ag-grid-community';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.scss']
})
export class DatatableComponent {
  @Input() columns = [];
  @Input() data = []
  options: GridOptions = {
    pagination: true,
    paginationAutoPageSize: true,
    columnDefs: this.columns,
    rowData: this.data
  }
  private api: GridApi;
  

  gridReady(ready: any) {
    this.api = ready.api
    this.api.setColumnDefs(this.columns)
    this.api.addItems(this.data)
  }
}
