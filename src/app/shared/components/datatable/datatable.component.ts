import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {GridApi, GridOptions} from 'ag-grid-community';
import {Observable} from "rxjs";

@Component({
    selector: 'app-datatable',
    templateUrl: './datatable.component.html',
    styleUrls: ['./datatable.component.scss']
})
export class DatatableComponent implements OnChanges {
    @Input() columnDefs = [];
    @Input() rowData = [];
    @Input() frameworkComponents: any;

    options: GridOptions = {
        pagination: true,
        paginationAutoPageSize: true,
        rowSelection: 'single',
        onRowClicked: event => console.log('A row was clicked'),
    }

    defaultColDef = {
        width: 200,                   // set every column width
        editable: false,              // Gaan niet editen in grid
        filter: 'agTextColumnFilter', // use 'text' filter by default
    };

    private api: GridApi;

    gridReady(ready: any) {
        console.log("fff")
        this.api = ready.api
        this.api.setColumnDefs(this.columnDefs)
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log(changes)
        if (this.api) {
            this.api.setRowData(this.rowData)
        }
    }
}
