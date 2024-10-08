import { Component, OnInit } from '@angular/core';
import { ColDef, RowSelectedEvent } from 'ag-grid-community';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { HeliosAuditDataset } from '../../../types/Helios';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import * as xlsx from 'xlsx';
import { nummerSort } from '../../../utils/Utils';
import { AuditService } from '../../../services/apiservice/audit.service';
import { faWaveSquare } from '@fortawesome/free-solid-svg-icons';


@Component({
    selector: 'app-audit-page',
    templateUrl: './audit-page.component.html',
    styleUrls: ['./audit-page.component.scss']
})

export class AuditPageComponent implements OnInit {
    readonly iconCardIcon: IconDefinition = faWaveSquare;

    data: HeliosAuditDataset[] = [];
    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'LAATSTE_AANPASSING', headerName: 'Tijd stempel', sortable: true},
        {field: 'NAAM', headerName: 'Naam', sortable: true },
        {field: 'ACTIE', headerName: 'Actie', sortable: true},
        {field: 'TABEL_NAAM', headerName: 'Tabel', sortable: true},
    ];

    // tonen van starts velden in rechter kolom
    voor: any;
    wijziging: any;
    resultaat: any;

    isLoading = false;
    magExporten = false;

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om starts ophalen te beperken

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly auditService: AuditService) { }

    ngOnInit(): void {
        this.opvragen();
        this.magExporten = true
    }

    // Opvragen van de starts via de api
    opvragen() {
        clearTimeout(this.zoekTimer);

        this.zoekTimer = window.setTimeout(() => {
            this.isLoading = true;
            this.auditService.getAudit(this.zoekString).then((dataset) => {
                this.isLoading = false;
                this.data = dataset;
            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        }, 400);
    }


    // Export naar excel
    exportDataset() {
        const ws = xlsx.utils.json_to_sheet(this.data);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'audit ' + new Date().toJSON().slice(0, 10) + '.xlsx');
    }

    selectRow($event: RowSelectedEvent) {
        this.voor = JSON.parse($event.data.VOOR);
        this.wijziging = JSON.parse($event.data.DATA);
        this.resultaat = JSON.parse($event.data.RESULTAAT);

    }
}

