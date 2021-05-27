import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {GridApi, GridOptions, RowDoubleClickedEvent} from 'ag-grid-community';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.scss']
})
export class DatatableComponent implements OnChanges {
  @Input() columnDefs = [];
  @Input() rowData = [];
  @Input() frameworkComponents: any;
  @Output() rowDoubleClicked: EventEmitter<RowDoubleClickedEvent> = new EventEmitter<RowDoubleClickedEvent>();
  options: GridOptions = {
    pagination: true,
    paginationAutoPageSize: true,
    rowSelection: 'single',
    onRowClicked: event => console.log('A row was clicked'),
    onRowDoubleClicked: this.onRowDoubleClicked.bind(this)
  };

  defaultColDef = {
    width: 200,                   // set every column width
    editable: false,              // Gaan niet editen in grid
    filter: 'agTextColumnFilter', // use 'text' filter by default
  };

  private api: GridApi;

  gridReady(ready: any) {
    this.api = ready.api;
    this.api.setColumnDefs(this.columnDefs);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.api) {
      this.api.setRowData(this.rowData);
    }
  }

  onRowDoubleClicked(event: RowDoubleClickedEvent) {
    this.rowDoubleClicked.emit(event);
  };
}
