import {Component, HostListener, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {ColDef} from "ag-grid-community";
import {HeliosLogboekDataset, HeliosTrack} from "../../../types/Helios";
import {DateTime, Interval} from "luxon";
import {Subscription} from "rxjs";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
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
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {DatumKortRenderComponent} from "../datatable/datum-kort-render/datum-kort-render.component";
import {IconRenderComponent} from "./icon-render/icon-render.component";

type HeliosLogboekDatasetExtended = HeliosLogboekDataset & {
    inTijdspan?: boolean
    DatumDM?: string;
}

@Component({
    selector: 'app-vlieger-logboek',
    templateUrl: './vlieger-logboek.component.html',
    styleUrls: ['./vlieger-logboek.component.scss']
})

export class VliegerLogboekComponent implements OnInit, OnChanges, OnDestroy {
    @Input() id: string;
    @Input() VliegerID: number;
    @Input() deleteMode: boolean;
    @Input() Kolommen: string = "";
    @Input() MaxItems: number = 1000;

    @ViewChild(TijdInvoerComponent) tijdInvoerEditor: TijdInvoerComponent;
    @ViewChild(TrackEditorComponent) trackEditor: TrackEditorComponent;
    @ViewChild(StartEditorComponent) startEditor: StartEditorComponent;

    toonLogboekKlein: boolean = false;     // Klein formaat van het vliegerlogboek

    data: HeliosLogboekDatasetExtended[] = [];
    private dbEventAbonnement: Subscription;
    private resizeSubscription: Subscription;   // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private datumAbonnement: Subscription;      // volg de keuze van de kalender
    private maandAbonnement: Subscription;      // volg de keuze van de kalender
    datum: DateTime = DateTime.now();           // de gekozen dag

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;
    isLoading: boolean = false;

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'DATUM', headerName: 'Datum', sortable: true, maxWidth: 70, minWidth: 60, cellRenderer: 'datumKortRender'},
        {field: 'REG_CALL', headerName: 'Vliegtuig', sortable: true},
        {field: 'VELD', headerName: 'Veld', hide: true},
        {field: 'CHECKSTART', headerName: 'Trainingsvlucht', hide: true, sortable: true, cellRenderer: 'checkboxRender'},
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
                tijdClicked: (record: HeliosLogboekDatasetExtended) => {
                    if (record.inTijdspan) {
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
                tijdClicked: (record: HeliosLogboekDatasetExtended) => {
                    if (record.inTijdspan) {
                        this.tijdInvoerEditor.openLandingsTijdPopup(record);
                    }
                }
            },
        },
        {field: 'DUUR', headerName: 'Duur', sortable: true, comparator: tijdSort},
        {headerName: 'I T P', cellRenderer: 'iconRender', maxWidth: 60, minWidth: 60},
        {field: 'OPMERKINGEN', headerName: 'Opmerkingen', hide: true}
    ];
    columns: ColDef[] = this.dataColumns;

    // kolom om vlieger track aan te maken
    aanmakenTrackColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 70,
        initialWidth: 70,
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

    rowClassRules = {
        'start_niet_wijzigbaar': function(params: any) { return !params.data.inTijdspan; },
    }

    frameworkComponents = {
        datumRender: DatumRenderComponent,
        datumKortRender: DatumKortRenderComponent,
        iconRender: IconRenderComponent,
        naamRender: NaamRenderComponent,
        trackRender: TrackRenderComponent,
        startTijdRender: StarttijdRenderComponent,
        landingsTijdRender: LandingstijdRenderComponent,
        deleteAction: DeleteActionComponent,
    };

    constructor(private readonly startlijstService: StartlijstService,
                private readonly trackService: TracksService,
                private readonly configService: PegasusConfigService,
                private readonly sharedService: SharedService,
                private readonly loginService: LoginService) {
    }

    ngOnInit(): void {
        // Op safari hebben we een korte vertraging nodig op te zorgen dat initialisatie gedaan is
        setTimeout(() => {
            // de datum zoals die in de kalender gekozen is
            this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
                // ophalen is alleen nodig als er een ander jaar gekozen is in de kalendar
                const ophalen = ((this.data == undefined) || (this.datum.year != datum.year))
                this.datum = DateTime.fromObject({
                    year: datum.year,
                    month: datum.month,
                    day: datum.day
                })
                if (ophalen) {
                    this.data = [];
                    this.opvragen();
                }
            });

            // de datum zoals die in de kalender gekozen is
            this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
                if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                    // ophalen is alleen nodig als er een ander jaar gekozen is in de kalendar
                    const ophalen = ((this.data == undefined) || (this.datum.year != jaarMaand.year))
                    this.datum = DateTime.fromObject({
                        year: jaarMaand.year,
                        month: jaarMaand.month,
                        day: 1
                    })
                    if (ophalen) {
                        this.data = [];
                        this.opvragen();
                    }
                }
            })

            // Als daginfo of startlijst is aangepast, moet we kalender achtergrond ook updaten
            this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
                if (ev.tabel == "Startlijst") {
                    this.opvragen();
                }
            });
        }, 250);

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize()
        });

        this.kolomDefinitie();
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
        if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement)       this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription)    this.resizeSubscription.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.opvragen()
        }
        this.kolomDefinitie();
    }

    // toon groot of klein logboek zijn, afhankelijk van scherm breedte
    onWindowResize() {
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
                let data:HeliosLogboekDatasetExtended[] = (dataset) ? dataset : [];

                const ui = this.loginService.userInfo;
                const nu:  DateTime = DateTime.now()

                for (let i = 0; i < data.length; i++) {
                    const diff = Interval.fromDateTimes(DateTime.fromSQL(data[i].DATUM!), nu);
                    if (Math.floor(diff.length("days")) > this.configService.maxZelfEditDagen()) {
                        data[i].inTijdspan = ui!.Userinfo!.isBeheerder!;   // alleen beheerder mag na xx dagen wijzigen. xx is geconfigureerd in pegasus.config
                    }
                    else {
                        data[i].inTijdspan = true; // zitten nog binnen de termijn
                    }
                    data[i].DatumDM = this.sharedService.datumDM(data[i].DATUM!)
                }
                this.data = data;
            }).catch(e => {
                this.isLoading = false;
                this.data = [];
                this.error = e;
            });
        }
    }

    // openen van popup om bestaande start te kunnen aanpassen
    openStartEditor(vlucht: HeliosLogboekDatasetExtended) {
        if (vlucht.inTijdspan) {
            this.startEditor.openPopup(vlucht);
        }
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
        this.toonLogboekKlein = (this.sharedService.getSchermSize() < SchermGrootte.xl);

        let kolom: ColDef;
        kolom = this.columns.find(c => c.field == "STARTMETHODE") as ColDef;
        if (this.sharedService.getSchermSize() < SchermGrootte.md) {
            kolom.hide = true;
        }
        else {
            kolom.hide = !this.Kolommen.includes("STARTMETHODE");
        }

        kolom = this.columns.find(c => c.field == "VELD") as ColDef;
        if (this.sharedService.getSchermSize() < SchermGrootte.xxl) {
            kolom.hide = true;
        }
        else {
            kolom.hide = !this.Kolommen.includes("VELD");
        }

        kolom = this.columns.find(c => c.field == "OPMERKINGEN") as ColDef;
        if (this.sharedService.getSchermSize() < SchermGrootte.xxl) {
            kolom.hide = true;
        }
        else {
            kolom.hide = !this.Kolommen.includes("OPMERKINGEN");
        }

        kolom = this.columns.find(c => c.field == "VLIEGERNAAM") as ColDef;
        kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.lg;

        kolom = this.columns.find(c => c.field == "INZITTENDENAAM") as ColDef;
        kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.lg;


        this.columns = this.dataColumns;
        if (!this.deleteMode) {
            const ui = this.loginService.userInfo?.Userinfo
            if ((ui!.isBeheerder || ui!.isCIMT || ui!.isInstructeur) && (this.sharedService.getSchermSize() >= SchermGrootte.md)) {
                this.columns = this.aanmakenTrackColumn.concat(this.dataColumns);
            }
        } else {
            this.columns = this.deleteColumn.concat(this.dataColumns);
        }
    }
}
