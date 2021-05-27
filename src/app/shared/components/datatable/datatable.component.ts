import {Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {ColumnSt, GridApi, GridOptions, RowDoubleClickedEvent} from 'ag-grid-community';
import {Observable} from 'rxjs';
import {StorageService} from "../../../services/storage/storage.service";

@Component({
    selector: 'app-datatable',
    templateUrl: './datatable.component.html',
    styleUrls: ['./datatable.component.scss']
})
export class DatatableComponent implements OnChanges, OnDestroy {
    @Input() columnDefs = [];
    @Input() rowData = [];
    @Input() frameworkComponents: any;
    @Input() id: string;
    @Input() sizeToFit: boolean = true;
    @Output() rowDoubleClicked: EventEmitter<RowDoubleClickedEvent> = new EventEmitter<RowDoubleClickedEvent>();

    options: GridOptions = {
        pagination: true,
        paginationAutoPageSize: true,
        rowSelection: 'single',
        onRowDoubleClicked: this.onRowDoubleClicked.bind(this),
    };

    defaultColDef = {
        width: 200,                   // set every column width
        editable: false,              // Gaan niet editen in grid
        filter: 'agTextColumnFilter', // use 'text' filter by default
    };

    private api: GridApi;
    private columnStateTimer: number | null = null;

    constructor(private readonly storageService: StorageService) {
    }

    ngOnDestroy() {
        if (this.columnStateTimer) {
            clearInterval(this.columnStateTimer);
        }
    }

    gridReady(ready: any) {
        this.api = ready.api;
        this.api.setColumnDefs(this.columnDefs);

        this.RestoreColumnState();

        // automatisch column aanpassen bij wijzigen window size
        if (this.sizeToFit) {
            window.onresize = () => {
                this.api.sizeColumnsToFit();
            }
        }
        this.columnStateTimer = setInterval(() => this.StoreColumnState(), 5000)
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.api) {
            this.api.setRowData(this.rowData);
        }
    }

    onRowDoubleClicked(event: RowDoubleClickedEvent) {
        this.rowDoubleClicked.emit(event);
    }

    RestoreColumnState() {
        if (this.id) {
            let indeling = this.storageService.ophalen(this.id);

            if (indeling != null) {
                this.options.columnApi?.applyColumnState({state: indeling, applyOrder: true});
            }
        }

        if (this.sizeToFit) {
            this.api.sizeColumnsToFit();
        }
    }

    StoreColumnState() {
        if (this.id) {
            let indeling = this.options.columnApi?.getColumnState();
            this.storageService.opslaan(this.id, indeling, -1)
        }
    }
}
