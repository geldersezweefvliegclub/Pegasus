import {Component, EventEmitter, Input, OnInit, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {ColDef, GridApi, GridOptions, RowDoubleClickedEvent} from 'ag-grid-community';
import {StorageService} from '../../../services/storage/storage.service';

@Component({
    selector: 'app-datatable',
    templateUrl: './datatable.component.html',
    styleUrls: ['./datatable.component.scss']
})
export class DatatableComponent implements OnInit, OnChanges, OnDestroy {
    @Input() columnDefs = [];
    @Input() rowData = [];
    @Input() frameworkComponents: any;
    @Input() id: string;
    @Input() sizeToFit: boolean = true;
    @Input() autoHeight: boolean = false;
    @Input() rowHeight: number =40;
    @Output() rowDoubleClicked: EventEmitter<RowDoubleClickedEvent> = new EventEmitter<RowDoubleClickedEvent>();

    options: GridOptions = {
        pagination: true,
        rowHeight: 40,
        headerHeight:20,
        paginationAutoPageSize: true,
        rowSelection: 'single',
        onRowDoubleClicked: this.onRowDoubleClicked.bind(this),
    };

    defaultColDef: ColDef = {
        editable: false,              // Gaan niet editen in grid
        autoHeight: this.autoHeight,
        filter: 'agTextColumnFilter', // use 'text' filter by default
    };

    private api: GridApi;
    private columnStateTimer: number | null = null;

    constructor(private readonly storageService: StorageService) {
    }

    ngOnInit()
    {
      this.defaultColDef.autoHeight = this.autoHeight;
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
        this.columnStateTimer = setInterval(() => this.StoreColumnState(), 10000)
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.api) {
            this.api.setColumnDefs(this.columnDefs);
            this.RestoreColumnState();

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
