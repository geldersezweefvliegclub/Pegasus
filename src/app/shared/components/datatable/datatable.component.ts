import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ColDef, GridApi, GridOptions, RowDoubleClickedEvent, RowSelectedEvent } from 'ag-grid-community';
import { SharedService } from '../../../services/shared/shared.service';
import { Subscription } from 'rxjs';

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
    @Input() loading = false;
    @Input() sizeToFit = true;
    @Input() autoSizeColumns = false;
    @Input() autoHeight = false;
    @Input() rowHeight = 40;
    @Input() multipleSelection = false;
    @Input() pagination = true;
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
        onRowClicked: this.onRowSelected.bind(this),
        defaultColDef: {
            resizable: true,
            flex: 1
        }
    };

    defaultColDef: ColDef = {
        editable: false,              // Gaan niet editen in grid
        autoHeight: this.autoHeight,
        filter: 'agTextColumnFilter', // use 'text' leden-filter by default
    };
    private api: GridApi | undefined;
    private columnStateTimer: number | null = null;
    private resizeSubscription: Subscription;           // Abonneer op aanpassing van window grootte (of draaien mobiel)

    noRowsTemplate;
    loadingTemplate;

    constructor(private readonly sharedService: SharedService) {
        this.loadingTemplate = '<span><img src="assets/img/zandloper.gif" alt="zandloper, even wachten" width=100px> Data wordt geladen .....</span>';
        this.noRowsTemplate = '<span>Geen informatie beschikbaar</span>';
    }

    ngOnInit() {
        this.defaultColDef.autoHeight = this.autoHeight;
        this.options.pagination = this.pagination;

        if (this.multipleSelection)
        {
            this.options.rowSelection = 'multiple'
            this.options.rowMultiSelectWithClick = true;
        }

        if (this.rowClassRules) {
            this.options.rowClassRules = this.rowClassRules;
        }

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize()
        });
    }

    ngOnDestroy(): void {
        if (this.columnStateTimer) {
            clearInterval(this.columnStateTimer);
        }

        if (this.resizeSubscription) {
            this.resizeSubscription.unsubscribe();
        }

        this.api = undefined;
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.options.pagination = this.pagination;

        if (this.multipleSelection) {
            this.options.rowSelection = 'multiple'
            this.options.rowMultiSelectWithClick = true;
        }
        else {
            this.options.rowSelection = 'single'
        }

        if (this.api) {
            this.api.setGridOption("columnDefs", this.columnDefs);
            this.api.setGridOption("rowData", this.rowData);

            if (changes.hasOwnProperty("loading")) {
                this.api.setGridOption("loading", changes["loading"].currentValue);
            }
        }
        else
        {
            console.log("no api", this.id)
        }
    }

    // zorg dat alle kolomen weer netjes binnen het scherm passen
    onWindowResize() {
        this.sizeColumnsToFit();
    }

    gridReady(ready: any) {
        console.log(this.id, "grid ready")
        this.api = ready.api;

        this.api!.setGridOption("columnDefs", this.columnDefs);
        this.api!.sizeColumnsToFit()

        this.columnStateTimer = window.setInterval(() => {
            this.sizeColumnsToFit()
        }, 5000)
    }

    sizeColumnsToFit() {
        if (this.api) {
            if (this.sizeToFit) {
                this.api.sizeColumnsToFit();
            }
            if (this.autoSizeColumns) {
                this.api.autoSizeAllColumns(false);
            }
        }
    }

    onRowDoubleClicked(event: RowDoubleClickedEvent) {
        this.rowDoubleClicked.emit(event);
    }

    onRowSelected(event: RowSelectedEvent) {
        this.rowSelected.emit(event);
    }

    refreshGrid() {
        if (this.api) {
            this.api.refreshCells({force: true});
        }
    }

    filteredRecords(): any[] {
        const rowData:any = [];
        if (this.api) {
            this.api.forEachNodeAfterFilter(node => {
                rowData.push(node.data);
            });
        }
        return rowData;
    }

    selectedRecords(): any[] {
        if (this.api) {
            return this.api.getSelectedRows()
        }
        return []
    }
}
