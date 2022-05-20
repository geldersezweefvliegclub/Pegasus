import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {DateTime} from "luxon";
import {ColDef} from "ag-grid-community";
import {Subscription} from "rxjs";
import {HeliosLedenDataset} from "../../../types/Helios";
import {nummerSort} from "../../../utils/Utils";
import {DienstenService} from "../../../services/apiservice/diensten.service";
import {SharedService} from "../../../services/shared/shared.service";
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {OnderdrukNulComponent} from "../../../shared/components/datatable/onderdruk-nul/onderdruk-nul.component";
import * as xlsx from "xlsx";

type JaarTotaal = {
    ID: number
    NAAM: string
    AVATAR: string

    JANUARI: number
    FEBRUARI: number
    MAART: number
    APRIL: number
    MEI: number
    JUNI: number
    JULI: number
    AUGUSTUS: number
    SEPTEMBER: number
    OKTOBER: number
    NOVEMBER: number
    DECEMBER: number

    JAAR_TOTAAL: number
}

@Component({
    selector: 'app-jaar-totalen',
    templateUrl: './jaar-totalen.component.html',
    styleUrls: ['./jaar-totalen.component.scss']
})
export class JaarTotalenComponent implements OnInit {
    @Input() leden: HeliosLedenDataset[];
    @ViewChild(ModalComponent) private popup: ModalComponent;

    jaarTotalen: JaarTotaal[];

    private datumAbonnement: Subscription;      // volg de keuze van de kalender
    datum: DateTime = DateTime.now();           // de gekozen dag

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'NAAM', headerName: 'NAAM', sortable: true},

        {
            field: 'JAAR_TOTAAL',
            headerName: 'Jaar',
            sortable: true,
            comparator: nummerSort,
            cellRenderer: 'nummerRender'
        },

        {field: 'MAART', headerName: 'Maart', sortable: true, comparator: nummerSort, cellRenderer: 'nummerRender'},
        {field: 'APRIL', headerName: 'April', sortable: true, comparator: nummerSort, cellRenderer: 'nummerRender'},
        {field: 'MEI', headerName: 'Mei', sortable: true, comparator: nummerSort, cellRenderer: 'nummerRender'},
        {field: 'JUNI', headerName: 'Juni', sortable: true, comparator: nummerSort, cellRenderer: 'nummerRender'},
        {field: 'JULI', headerName: 'Juli', sortable: true, comparator: nummerSort, cellRenderer: 'nummerRender'},
        {
            field: 'AUGUSTUS',
            headerName: 'Augustus',
            sortable: true,
            comparator: nummerSort,
            cellRenderer: 'nummerRender'
        },
        {
            field: 'SEPTEMBER',
            headerName: 'September',
            sortable: true,
            comparator: nummerSort,
            cellRenderer: 'nummerRender'
        },
        {field: 'OKTOBER', headerName: 'Oktober', sortable: true, comparator: nummerSort, cellRenderer: 'nummerRender'},
    ];

    frameworkComponents = {
        nummerRender: OnderdrukNulComponent,
    };

    constructor(private readonly dienstenService: DienstenService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1
                })
            }
        })
    }

    // Open leden-filter dialoog met de leden-filter opties
    openPopup() {
        this.popup.open();
        this.opvragen();
    }

    // opvragen van alle diensten
    opvragen(): void {
        const totals: JaarTotaal[] = [];

        // alle leden met lege data toevoegen aan het grid
        this.leden.forEach(lid => {
            totals.push({
                ID: lid.ID as number,
                NAAM: lid.NAAM as string,
                AVATAR: lid.AVATAR as string,

                JANUARI: 0,
                FEBRUARI: 0,
                MAART: 0,
                APRIL: 0,
                MEI: 0,
                JUNI: 0,
                JULI: 0,
                AUGUSTUS: 0,
                SEPTEMBER: 0,
                OKTOBER: 0,
                NOVEMBER: 0,
                DECEMBER: 0,

                JAAR_TOTAAL: 0
            });
        });

        this.dienstenService.getTotalen(this.datum.year).then(totalen => {
            totalen.forEach(mnd => {
                const idx = totals.findIndex(r => r.ID == mnd.LID_ID);
                if (idx < 0) {
                    console.error("Lid " + mnd.LID_ID + " onbekend");  // dat mag nooit voorkomen
                } else {
                    switch (mnd.MAAND) {
                        case 1:
                            totals[idx].JANUARI = mnd.AANTAL as number;
                            break;
                        case 2:
                            totals[idx].FEBRUARI = mnd.AANTAL as number;
                            break;
                        case 3:
                            totals[idx].MAART = mnd.AANTAL as number;
                            break;
                        case 4:
                            totals[idx].APRIL = mnd.AANTAL as number;
                            break;
                        case 5:
                            totals[idx].MEI = mnd.AANTAL as number;
                            break;
                        case 6:
                            totals[idx].JUNI = mnd.AANTAL as number;
                            break;
                        case 7:
                            totals[idx].JULI = mnd.AANTAL as number;
                            break;
                        case 8:
                            totals[idx].AUGUSTUS = mnd.AANTAL as number;
                            break;
                        case 9:
                            totals[idx].SEPTEMBER = mnd.AANTAL as number;
                            break;
                        case 10:
                            totals[idx].OKTOBER = mnd.AANTAL as number;
                            break;
                        case 11:
                            totals[idx].NOVEMBER = mnd.AANTAL as number;
                            break;
                        case 12:
                            totals[idx].DECEMBER = mnd.AANTAL as number;
                            break;

                        default:
                            totals[idx].JAAR_TOTAAL = mnd.AANTAL as number;
                            break;
                    }
                }

            });
            this.jaarTotalen = totals;
        });
    }

    exportJaarRooster() {
        let ws = xlsx.utils.json_to_sheet(this.jaarTotalen);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'jaar totalen ' + this.datum.year + '-' + new Date().toJSON().slice(0, 10) + '.xlsx');
    }
}
