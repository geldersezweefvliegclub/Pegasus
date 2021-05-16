import {Component, Input} from '@angular/core';
import {GridOptions} from 'ag-grid-community';

@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.scss']
})
export class DatatableComponent {
  @Input() columns = [
    {field: 'make', sortable: true},
    {field: 'model', sortable: true},
    {field: 'price', sortable: true}
  ];
  @Input() data = [
    {make: 'Toyota', model: 'Celica', price: 35000},
    {make: 'Ford', model: 'Mondeo', price: 32000},
    {make: 'Porsche', model: 'Boxter', price: 72000}
  ];

  options: GridOptions = {
    pagination: true,
    paginationAutoPageSize: true,
    columnDefs: this.columns,
    rowData: this.data
  }
  constructor() {
    for (let i = 1; i <= 500; i++) {
      this.data.push({make: `test${i}`, model: 'Test', price: i * 64.13});
    }
  }
}
