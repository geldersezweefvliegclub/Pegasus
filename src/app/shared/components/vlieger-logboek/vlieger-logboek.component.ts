import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {ColDef, RowDoubleClickedEvent} from "ag-grid-community";
import {HeliosLogboekDataset, HeliosStartDataset, HeliosTrack} from "../../../types/Helios";
import {DateTime, Interval} from "luxon";
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
import {DeleteActionComponent} from "../datatable/delete-action/delete-action.component";

@Component({
    selector: 'app-vlieger-logboek',
    templateUrl: './vlieger-logboek.component.html',
    styleUrls: ['./vlieger-logboek.component.scss']
})

export class VliegerLogboekComponent implements OnInit, OnChanges {
    @Input() id: string;
    @Input() VliegerID: number;
    @Input() deleteMode: boolean;
    @Input() Kolommen: string = "";

    @ViewChild(TijdInvoerComponent) tijdInvoerEditor: TijdInvoerComponent;
    @ViewChild(TrackEditorComponent) trackEditor: TrackEditorComponent;
    @ViewChild(StartEditorComponent) startEditor: StartEditorComponent;

    data: HeliosLogboekDataset[] = [];
    datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;
    isLoading: boolean = false;

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'DATUM', headerName: 'Datum', sortable: true, cellRenderer: 'datumRender'},
        {field: 'REG_CALL', headerName: 'Vliegtuig', sortable: true},
        {field: 'VELD', headerName: 'Veld', hide: true},
        {field: 'STARTMETHODE', headerName: 'Start methode', hide: true, sortable: true},
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
                    if (this.inTijdspan(record)) {
                        this.tijdInvoerEditor.openStarttijdPopup(record);
                    }
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
                    if (this.inTijdspan(record)) {
                        this.tijdInvoerEditor.openLandingsTijdPopup(record);
                    }
                }
            },
        },
        {field: 'DUUR', headerName: 'Duur', sortable: true, comparator: tijdSort},
        {field: 'OPMERKINGEN', headerName: 'Opmerkingen', hide: true}
    ];
    columns: ColDef[] = this.dataColumns;

    // kolom om vlieger track aan te maken
    aanmakenTrackColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        suppressSizeToFit: true,
        hide: false,
        cellClass: "geenDots",
        cellRenderer: 'trackRender', headerName: 'Tracks', sortable: false,
        cellRendererParams: {
            onTrackClicked: (LID_ID: number, START_ID: number, NAAM: string, TEKST: string) => {
                this.openTrackEditor(LID_ID, START_ID, NAAM, TEKST);
            }
        },
    }];

    // kolom om record te verwijderen
    deleteColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        suppressSizeToFit: true,
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
        deleteAction: DeleteActionComponent,
    };

    constructor(private readonly startlijstService: StartlijstService,
                private readonly trackService: TracksService,
                private readonly sharedService: SharedService,
                private readonly loginService: LoginService) {
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })
            this.data = [];
            this.opvragen();
        });

        // Als daginfo of startlijst is aangepast, moet we kalender achtergrond ook updaten
        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Startlijst") {
                this.opvragen();
            }
        });

        this.kolomDefinitie();
    }

    // opvragen van het vlieger logboek
    opvragen(): void {
        if (this.datum) {
            const startDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
            const eindDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});

            this.isLoading = true;
            this.startlijstService.getLogboek(this.VliegerID, startDatum, eindDatum).then((dataset) => {
                this.isLoading = false;
                this.data = dataset;
            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        }
    }

    // openen van popup om bestaande start te kunnen aanpassen
    openStartEditor(event?: RowDoubleClickedEvent) {
        if (this.inTijdspan(event?.data)) {
            this.startEditor.openPopup(event?.data);
        }
    }

    // mogen we editen
    inTijdspan(record: HeliosStartDataset) {
        const nu:  DateTime = DateTime.now()

        const diff = Interval.fromDateTimes(DateTime.fromSQL(record.DATUM!), nu);
        if (diff.length("days") > 45) {
            return (this.loginService!.userInfo!.Userinfo!.isBeheerder!)      // alleen beheerder mag na 45 dagen wijzigen
        }
        return true;
    }

    // open de track editor om nieuwe track toe te voegen. Edit opent als popup
    private openTrackEditor(LID_ID: number, START_ID: number, NAAM: string, TEKST: string) {
        this.trackEditor.openPopup(null, LID_ID, START_ID, NAAM, TEKST);
    }

    // Toevoegen van een vlieger track aan de database
    ToevoegenTrack(track: HeliosTrack): void {
        this.trackService.addTrack(track);
        this.trackEditor.closePopup();
    }

    // Welke kolommen moet worden getoond in het grid
    kolomDefinitie() {
        const Sidx = this.dataColumns.findIndex((c) => c.field == "STARTMETHODE");
        this.dataColumns[Sidx].hide = !this.Kolommen.includes("STARTMETHODE");

        const Vidx = this.dataColumns.findIndex((c) => c.field == "VELD");
        this.dataColumns[Vidx].hide = !this.Kolommen.includes("VELD");

        const Oidx = this.dataColumns.findIndex((c) => c.field == "OPMERKINGEN");
        this.dataColumns[Oidx].hide = !this.Kolommen.includes("OPMERKINGEN");

        this.columns = this.dataColumns;
        if (!this.deleteMode) {
            this.columns = this.aanmakenTrackColumn.concat(this.dataColumns);
        } else {
            this.columns = this.deleteColumn.concat(this.dataColumns);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.opvragen()
        }
        this.kolomDefinitie();
    }
}
