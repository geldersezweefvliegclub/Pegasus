import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {ColDef} from "ag-grid-community";
import {HeliosLogboekDataset, HeliosStart, HeliosStartDataset} from "../../../types/Helios";
import {DateTime} from "luxon";
import {Subscription} from "rxjs";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {SharedService} from "../../../services/shared/shared.service";
import {DatumRenderComponent} from "../datatable/datum-render/datum-render.component";
import {StarttijdRenderComponent} from "../datatable/starttijd-render/starttijd-render.component";
import {LandingstijdRenderComponent} from "../datatable/landingstijd-render/landingstijd-render.component";
import {NaamRenderComponent} from "./naam-render/naam-render.component";
import {TijdInvoerComponent} from "../editors/tijd-invoer/tijd-invoer.component";
import {nummerSort, tijdSort} from '../../../utils/Utils';

@Component({
    selector: 'app-vlieger-logboek',
    templateUrl: './vlieger-logboek.component.html',
    styleUrls: ['./vlieger-logboek.component.scss']
})

export class VliegerLogboekComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;

    @ViewChild(TijdInvoerComponent) tijdInvoerEditor: TijdInvoerComponent;

    data: HeliosLogboekDataset[] = [];
    datumAbonnement: Subscription;
    datum: DateTime;                       // de gekozen dag in de kalender

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'DATUM', headerName: 'Datum', sortable: true, cellRenderer: 'datumRender'},
        {field: 'REG_CALL', headerName: 'RegCall', sortable: true},
        {field: 'STARTMETHODE', headerName: 'Start methode', sortable: true},
        {field: 'VLIEGERNAAM', headerName: 'Vlieger', sortable: true, cellRenderer: 'naamRender'},
        {field: 'INZITTENDENAAM', headerName: 'Inzittende', sortable: true, cellRenderer: 'naamRender'},
        {
            field: 'STARTTIJD',
            headerName: 'Starttijd',
            sortable: true,
            hide: false,
            cellRenderer: 'startTijdRender',
            comparator: tijdSort,
            cellRendererParams: {
                tijdClicked: (record: HeliosStartDataset) => {
                    this.tijdInvoerEditor.openStarttijdPopup(record);
                }
            },
        },
        {
            field: 'LANDINGSTIJD',
            headerName: 'Landingstijd',
            sortable: true,
            cellRenderer: 'landingsTijdRender',
            comparator: tijdSort,
            cellRendererParams: {
                tijdClicked: (record: HeliosStartDataset) => {
                    this.tijdInvoerEditor.openLandingsTijdPopup(record);
                }
            },
        },
        {field: 'DUUR', headerName: 'Duur', sortable: true, comparator: tijdSort},
        {field: 'OPMERKINGEN', headerName: 'Opmerkingen', sortable: true}
    ];

    frameworkComponents = {
        datumRender: DatumRenderComponent,
        naamRender: NaamRenderComponent,
        startTijdRender: StarttijdRenderComponent,
        landingsTijdRender: LandingstijdRenderComponent,
    };

    constructor(private readonly startlijstService: StartlijstService,
                private readonly sharedService: SharedService) {}

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

    // opvragen van het vlieger logboek
    opvragen() {
        if (this.datum) {
            this.startlijstService.getLogboek(this.VliegerID, this.datum.year).then((dataset) => {
                this.data = dataset;
            });
        }
    }

    // De starttijd is ingevoerd/aangepast. Opslaan van de starttijd
    opslaanStartTijd(start: HeliosStart) {
        this.startlijstService.startTijd(start.ID as number, start.STARTTIJD as string).then((s) => { this.opvragen(); });
        this.tijdInvoerEditor.closePopup();
    }

    // De landingstijd is ingevoerd/aangepast. Opslaan van de landingstijd
    opslaanLandingsTijd(start: HeliosStart) {
        this.startlijstService.landingsTijd(start.ID as number, start.LANDINGSTIJD as string).then((s) => { this.opvragen(); });
        this.tijdInvoerEditor.closePopup();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.opvragen()
        }
    }
}
