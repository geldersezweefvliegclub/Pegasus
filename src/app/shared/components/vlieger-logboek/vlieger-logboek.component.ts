import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {ColDef} from "ag-grid-community";
import {HeliosLogboekDataset, HeliosStart, HeliosStartDataset, HeliosTrack} from "../../../types/Helios";
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
import {TrackRenderComponent} from "./track-render/track-render.component";
import {LoginService} from "../../../services/apiservice/login.service";
import {TrackEditorComponent} from "../editors/track-editor/track-editor.component";
import {TracksService} from "../../../services/apiservice/tracks.service";
import {ErrorMessage, SuccessMessage} from "../../../types/Utils";
import {StartEditorComponent} from "../editors/start-editor/start-editor.component";

@Component({
    selector: 'app-vlieger-logboek',
    templateUrl: './vlieger-logboek.component.html',
    styleUrls: ['./vlieger-logboek.component.scss']
})

export class VliegerLogboekComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;
    @Input() VerwijderMode: number;

    @ViewChild(TijdInvoerComponent) tijdInvoerEditor: TijdInvoerComponent;
    @ViewChild(TrackEditorComponent) trackEditor: TrackEditorComponent;
    @ViewChild(StartEditorComponent) startEditor: StartEditorComponent;

    data: HeliosLogboekDataset[] = [];
    datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

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

    // kolom om vlieger track aan te maken
    aanmakenTrackColumn: ColDef = {
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        suppressSizeToFit:true,
        hide: false,
        cellClass: "geenDots",
        cellRenderer: 'trackRender', headerName: 'Tracks', sortable: false,
        cellRendererParams: {
            onTrackClicked: (LID_ID: number, START_ID: number, NAAM: string, TEKST:string) => {
                this.openTrackEditor(LID_ID, START_ID, NAAM, TEKST);
            }
        },
    };

    // kolom om record te verwijderen
    deleteColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        suppressSizeToFit:true,
        hide: false,
        cellRenderer: 'deleteAction', headerName: '', sortable: false,
        cellRendererParams: {
            onDeleteClicked: (ID: number) => {
                this.startEditor.openVerwijderPopup(ID);
            }
        },
    }];

    frameworkComponents = {
        datumRender: DatumRenderComponent,
        naamRender: NaamRenderComponent,
        trackRender: TrackRenderComponent,
        startTijdRender: StarttijdRenderComponent,
        landingsTijdRender: LandingstijdRenderComponent,
    };

    constructor(private readonly startlijstService: StartlijstService,
                private readonly trackService: TracksService,
                private readonly sharedService: SharedService,
                private readonly loginService: LoginService) {}

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })
            this.opvragen();
        });

        // Als daginfo of startlijst is aangepast, moet we kalender achtergrond ook updaten
        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Startlijst") {
                this.opvragen();
            }
        });

        // toevoegen van add track kolom
        let ui = this.loginService.userInfo?.Userinfo;
        if (ui?.isInstructeur || ui?.isCIMT || ui?.isBeheerder) {
            this.dataColumns.push(this.aanmakenTrackColumn);
        }
    }

    // opvragen van het vlieger logboek
    opvragen():void {
        if (this.datum) {
            const startDatum: DateTime = DateTime.fromObject( {year: this.datum.year, month: 1, day: 1});
            const eindDatum: DateTime = DateTime.fromObject( {year: this.datum.year, month: 12, day: 31});

            this.startlijstService.getLogboek(this.VliegerID, startDatum, eindDatum).then((dataset) => {
                this.data = dataset;
            }).catch(e => {
                this.error = e;
            });
        }
    }

    // open de track editor om nieuwe track toe te voegen. Edit opent als popup
    private openTrackEditor(LID_ID: number, START_ID: number, NAAM: string, TEKST:string) {
        this.trackEditor.openPopup(null, LID_ID, START_ID, NAAM, TEKST);
    }

    // Toevoegen van een vlieger track aan de database
    ToevoegenTrack(track: HeliosTrack): void {
        this.trackService.addTrack(track);
        this.trackEditor.closePopup();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.opvragen()
        }
    }
}
