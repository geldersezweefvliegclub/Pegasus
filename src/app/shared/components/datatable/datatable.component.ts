import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {
    ColDef,
    GridApi,
    GridOptions,
    RowDoubleClickedEvent,
    RowSelectedEvent
} from 'ag-grid-community';
import {StorageService} from '../../../services/storage/storage.service';
import {LoginService} from "../../../services/apiservice/login.service";

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
    @Input() loading: boolean = false;
    @Input() sizeToFit: boolean = true;
    @Input() autoHeight: boolean = false;
    @Input() rowHeight: number = 40;
    @Input() pagination: boolean = true;
    @Input() rowClassRules: any = null;
    @Output() rowDoubleClicked: EventEmitter<RowDoubleClickedEvent> = new EventEmitter<RowDoubleClickedEvent>();
    @Output() rowSelected: EventEmitter<RowSelectedEvent> = new EventEmitter<RowSelectedEvent>();

    options: GridOptions = {
        rowHeight: 40,
        headerHeight: 20,
        paginationAutoPageSize: true,
        rowSelection: 'single',
        pagination: true,
        onRowDoubleClicked: this.onRowDoubleClicked.bind(this),
        onRowClicked: this.onRowSelected.bind(this)
    };

    defaultColDef: ColDef = {
        editable: false,              // Gaan niet editen in grid
        autoHeight: this.autoHeight,
        filter: 'agTextColumnFilter', // use 'text' leden-filter by default
    };
    private api: GridApi;
    private columnStateTimer: number | null = null;

    noRowsTemplate;
    loadingTemplate;

    constructor() {
        this.loadingTemplate = '<span><img src="assets/img/zandloper.gif" alt="zandloper, even wachten" width=100px> Data wordt geladen .....</span>';
        this.noRowsTemplate = '<span>Geen informatie beschikbaar</span>';
    }

    ngOnInit() {
        this.defaultColDef.autoHeight = this.autoHeight;
        this.options.pagination = this.pagination;

        if (this.rowClassRules) {
            this.options.rowClassRules = this.rowClassRules;
        }
    }

    ngOnDestroy(): void {
        if (this.columnStateTimer) {
            clearInterval(this.columnStateTimer);
        }
    }

    gridReady(ready: any) {
        this.api = ready.api;
        this.api.setColumnDefs(this.columnDefs);

        this.api.sizeColumnsToFit()

        // automatisch column aanpassen bij wijzigen window size
        if (this.sizeToFit) {
            window.onresize = () => {
                this.api.sizeColumnsToFit();
            }
        }
        this.columnStateTimer = window.setInterval(() => {
            this.api.sizeColumnsToFit()
        }, 5000)
    }

    sizeColumnsToFit() {
        this.api.sizeColumnsToFit();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.api) {
            this.api.setColumnDefs(this.columnDefs);
            this.api.setRowData(this.rowData);


            if (changes.hasOwnProperty("loading")) {
                if (changes["loading"].currentValue) {
                    this.api.showLoadingOverlay()
                } else {
                    //  is niet nodig, gaat vanzelf
                }
            }
        }
    }

    onRowDoubleClicked(event: RowDoubleClickedEvent) {
        this.rowDoubleClicked.emit(event);
    }

    onRowSelected(event: RowSelectedEvent) {
        this.rowSelected.emit(event);
    }
}
