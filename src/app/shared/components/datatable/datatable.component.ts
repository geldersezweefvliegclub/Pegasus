import {
    Component,
    EventEmitter,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import {ColDef, GridApi, GridOptions, RowDoubleClickedEvent, RowSelectedEvent} from 'ag-grid-community';
import {SharedService} from "../../../services/shared/shared.service";
import {Subscription} from "rxjs";

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
    @Input() autoSizeColumns: boolean = false;
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

        this.api!.setColumnDefs(this.columnDefs);
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
                this.options!.columnApi!.autoSizeAllColumns(false);
            }
        }
    }

    onRowDoubleClicked(event: RowDoubleClickedEvent) {
        this.rowDoubleClicked.emit(event);
    }

    onRowSelected(event: RowSelectedEvent) {
        this.rowSelected.emit(event);
    }

    filteredRecords(): any[] {
        let rowData:any = [];
        if (this.api) {
            this.api.forEachNodeAfterFilter(node => {
                rowData.push(node.data);
            });
        }
        return rowData;
    }
}
