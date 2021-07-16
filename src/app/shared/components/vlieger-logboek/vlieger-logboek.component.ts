import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ColDef} from "ag-grid-community";
import {nummerSort, tijdSort} from "../../../types/Utils";
import {HeliosLogboek} from "../../../types/Helios";
import {DateTime} from "luxon";
import {Subscription} from "rxjs";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {SharedService} from "../../../services/shared/shared.service";
import {DatumRenderComponent} from "../datatable/datum-render/datum-render.component";

@Component({
    selector: 'app-vlieger-logboek',
    templateUrl: './vlieger-logboek.component.html',
    styleUrls: ['./vlieger-logboek.component.scss']
})

export class VliegerLogboekComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;
    data: HeliosLogboek[] = [];

    datumAbonnement: Subscription;
    datum: DateTime;                       // de gekozen dag in de kalender

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'DATUM', headerName: 'Datum', sortable: true, cellRenderer: 'datumRender'},
        {field: 'REG_CALL', headerName: 'RegCall', sortable: true},
        {field: 'STARTMETHODE', headerName: 'Start methode', sortable: true},
        {field: 'VLIEGERNAAM', headerName: 'Vlieger', sortable: true},
        {field: 'INZITTENDENAAM', headerName: 'Inzittende', sortable: true},
        {
            field: 'STARTTIJD',
            headerName: 'Starttijd',
            sortable: true,
            hide: false,
            cellRenderer: 'startTijdRender',
            comparator: tijdSort,
        },
        {
            field: 'LANDINGSTIJD',
            headerName: 'Landingstijd',
            sortable: true,
            cellRenderer: 'landingsTijdRender',
            comparator: tijdSort,
        },
        {field: 'DUUR', headerName: 'Duur', sortable: true, comparator: tijdSort},
        {field: 'OPMERKINGEN', headerName: 'Opmerkingen', sortable: true}
    ];

    frameworkComponents = {
        datumRender: DatumRenderComponent
    };

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })
            this.opvragen();
        })
    }

    constructor(private readonly startlijstService: StartlijstService,
                private readonly sharedService: SharedService) {

    }

    opvragen() {
        if (this.datum) {
            this.startlijstService.getLogboek(this.VliegerID, this.datum.year).then((dataset) => {
                this.data = dataset;
            });
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.opvragen()
        }
    }
}
