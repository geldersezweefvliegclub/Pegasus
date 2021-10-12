import {Component, OnInit, ViewChild} from '@angular/core';
import {StartlijstService} from '../../services/apiservice/startlijst.service';
import {CheckboxRenderComponent} from '../../shared/components/datatable/checkbox-render/checkbox-render.component';
import {faRecycle, faDownload} from '@fortawesome/free-solid-svg-icons';
import {ColDef, RowDoubleClickedEvent} from 'ag-grid-community';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {DeleteActionComponent} from '../../shared/components/datatable/delete-action/delete-action.component';
import {RestoreActionComponent} from '../../shared/components/datatable/restore-action/restore-action.component';
import {HeliosStartDataset} from '../../types/Helios';
import {ErrorMessage, KeyValueArray, SuccessMessage} from '../../types/Utils';
import * as xlsx from 'xlsx';
import {LoginService} from '../../services/apiservice/login.service';
import {faClipboardList} from '@fortawesome/free-solid-svg-icons/faClipboardList';
import {DateTime} from 'luxon';
import {VliegerRenderComponent} from './vlieger-render/vlieger-render.component';
import {InzittendeRenderComponent} from './inzittende-render/inzittende-render.component';
import {faFilter} from '@fortawesome/free-solid-svg-icons/faFilter';
import {StarttijdRenderComponent} from '../../shared/components/datatable/starttijd-render/starttijd-render.component';
import {LandingstijdRenderComponent} from '../../shared/components/datatable/landingstijd-render/landingstijd-render.component';
import {TijdInvoerComponent} from '../../shared/components/editors/tijd-invoer/tijd-invoer.component';
import {StartEditorComponent} from '../../shared/components/editors/start-editor/start-editor.component';
import {Subscription} from 'rxjs';
import {SharedService} from '../../services/shared/shared.service';
import {nummerSort, tijdSort} from '../../utils/Utils';
import {ExportStartlijstComponent} from "./export-startlijst/export-startlijst.component";

@Component({
    selector: 'app-startlijst-grid',
    templateUrl: './startlijst-grid.component.html',
    styleUrls: ['./startlijst-grid.component.scss']
})
export class StartlijstGridComponent implements OnInit {
    @ViewChild(StartEditorComponent) editor: StartEditorComponent;
    @ViewChild(TijdInvoerComponent) tijdInvoerEditor: TijdInvoerComponent;
    @ViewChild(ExportStartlijstComponent) exportStartlijstKeuze: ExportStartlijstComponent;

    data: HeliosStartDataset[] = [];
    isLoading: boolean = false;
    isExporting: boolean = false;

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'DAGNUMMER', headerName: '#', sortable: true,},
        {field: 'REGISTRATIE', headerName: 'Registratie', sortable: true, hide: true, enableRowGroup: true},
        {field: 'CALLSIGN', headerName: 'Callsign', sortable: true, hide: true, enableRowGroup: true},
        {field: 'REG_CALL', headerName: 'RegCall', sortable: true, enableRowGroup: true},
        {field: 'CLUBKIST', headerName: 'Clubkist', sortable: true, cellRenderer: 'checkboxRender', hide: true},
        {field: 'STARTMETHODE', headerName: 'Start methode', sortable: true, hide: true, enableRowGroup: true},

        {
            field: 'VLIEGERNAAM_LID',
            headerName: 'Vlieger',
            sortable: true,
            enableRowGroup: true,
            cellRenderer: 'vliegerRender'
        },
        {
            field: 'INZITTENDENAAM_LID',
            headerName: 'Inzittende',
            sortable: true,
            enableRowGroup: true,
            cellRenderer: 'inzittendeRender'
        },

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
        {field: 'OPMERKINGEN', headerName: 'Opmerkingen', sortable: true},
        {field: 'VLIEGTUIG_ID', headerName: 'Vliegtuig ID', sortable: true, hide: true},
        {field: 'STARTMETHODE_ID', headerName: 'Startmethode ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'VLIEGER_ID', headerName: 'Vlieger ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'INZITTENDE_ID', headerName: 'Inzittende ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'SLEEPKIST_ID', headerName: 'Sleepkist ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'SLEEP_HOOGTE', headerName: 'Sleep hoogte', sortable: true, hide: true, comparator: nummerSort},
        {field: 'VELD', headerName: 'Veld', sortable: true, hide: true},
    ];

    columns: ColDef[] = this.dataColumns;

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
                this.editor.openVerwijderPopup(ID);
            }
        },
    }];

    // kolom om terug te kunnen terughalen
    restoreColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        suppressSizeToFit: true,
        hide: false,
        cellRenderer: 'restoreAction', headerName: '', sortable: false,
        cellRendererParams: {
            onRestoreClicked: (ID: number) => {
                this.editor.openRestorePopup(ID);
            }
        },
    }];

    frameworkComponents = {
        vliegerRender: VliegerRenderComponent,
        inzittendeRender: InzittendeRenderComponent,
        startTijdRender: StarttijdRenderComponent,
        landingsTijdRender: LandingstijdRenderComponent,
        checkboxRender: CheckboxRenderComponent,
        deleteAction: DeleteActionComponent,
        restoreAction: RestoreActionComponent
    };
    iconCardIcon: IconDefinition = faClipboardList;
    downloadIcon: IconDefinition = faDownload;
    filterIcon: IconDefinition = faFilter;
    prullenbakIcon: IconDefinition = faRecycle;

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om data ophalen te beperken
    deleteMode: boolean = false;        // zitten we in delete mode om starts te kunnen verwijderen
    trashMode: boolean = false;         // zitten in restore mode om starts te kunnen terughalen

    filterOn: boolean = false;

    datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag in de kalender

    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    magExporten: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly startlijstService: StartlijstService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        // plaats de juiste kolommen in het grid
        this.kolomDefinitie();

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
            this.data = [];
            this.opvragen();
        });

        // Als startlijst is aangepast, moeten we grid opnieuw laden
        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Startlijst") {
                this.opvragen();
            }
        });

        const ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT || ui?.isInstructeur || ui?.isDDWV || ui?.isClubVlieger) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT || ui?.isInstructeur || ui?.isClubVlieger) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT || ui?.isInstructeur || ui?.isDDWV || ui?.isClubVlieger) ? true : false;
        this.magExporten = (!ui?.isDDWV) ? true : false;
    }

    // openen van popup om nieuwe start te kunnen invoeren
    addStart(): void {
        if (this.magToevoegen) {
            this.editor.openPopup(null);
        }
    }

    // openen van popup om bestaande start te kunnen aanpassen
    openEditor(event?: RowDoubleClickedEvent) {
        if (this.magWijzigen) {
            this.editor.openPopup(event?.data.ID);
        }
    }

    // schakelen tussen deleteMode JA/NEE. In deleteMode kun je starts verwijderen
    deleteModeJaNee() {
        if (this.magVerwijderen) {
            this.deleteMode = !this.deleteMode;
            this.kolomDefinitie();
        }
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde starts getoond
    trashModeJaNee() {
        this.kolomDefinitie();
        this.opvragen();
    }

    // Welke kolommen moet worden getoond in het grid
    kolomDefinitie() {
        if (!this.deleteMode) {
            this.columns = this.dataColumns;
        } else {
            if (this.trashMode) {
                this.columns = this.restoreColumn.concat(this.dataColumns)
            } else {
                this.columns = this.deleteColumn.concat(this.dataColumns)
            }
        }
    }

    // Opvragen van de data via de api
    opvragen() {
        let queryParams: KeyValueArray = {};

        if (this.filterOn) {
            queryParams["OPEN_STARTS"] = "true"
        }

        this.isLoading = true;
        this.startlijstService.getStarts(this.trashMode, this.datum, this.datum, this.zoekString, queryParams).then((dataset) => {
            this.data = dataset;
            this.isLoading = false;
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });
    }

    // keuze voor startlijst export
    expoteerStartlijst() {
        this.exportStartlijstKeuze.openPopup();
    }

    // Export naar excel
    // ExportDMJ = "dag", "maand" of "jaar"
    async exportDataset(exportDMJ: string) {
        this.isExporting = true;

        let datum: DateTime = DateTime.fromObject({
            year: this.datum.year,
            month: this.datum.month,
            day: this.datum.day
        })

        const queryParams: KeyValueArray = {}
        queryParams["SORT"] = "DATUM"


        let tobeExported: HeliosStartDataset[] = []
        let bestandsnaam: string = datum.toISODate()
        switch (exportDMJ) {
            case "dag": {
                bestandsnaam = datum.toISODate()
                tobeExported = this.data; // default is dag
                break;
            }
            case "maand": {
                let vanDatum: DateTime = DateTime.fromObject({
                    year: this.datum.year,
                    month: this.datum.month,
                    day: 1
                })

                let totDatum: DateTime = DateTime.fromObject({
                    year: this.datum.year,
                    month: this.datum.month,
                    day: this.datum.daysInMonth
                })

                try {
                    tobeExported = await this.startlijstService.getStarts(this.trashMode, vanDatum, totDatum, this.zoekString, queryParams);
                } catch (e) {
                    this.error = e;
                    this.isLoading = false;
                }

                bestandsnaam = datum.month.toString() + "-" + datum.year.toString()
                break;
            }
            case "jaar": {
                let vanDatum: DateTime = DateTime.fromObject({
                    year: this.datum.year,
                    month: 1,
                    day: 1
                })

                let totDatum: DateTime = DateTime.fromObject({
                    year: this.datum.year,
                    month: 12,
                    day: 31
                })

                try {
                    tobeExported = await this.startlijstService.getStarts(this.trashMode, vanDatum, totDatum, this.zoekString, queryParams);
                } catch (e) {
                    this.error = e;
                    this.isLoading = false;
                }

                bestandsnaam = datum.year.toString()
                break;
            }
        }

        // Datum in juiste formaat zetten
        tobeExported.forEach((dag) => {
            const d = DateTime.fromSQL(dag.DATUM!);
            dag.DATUM = d.day + "-" + d.month + "-" + d.year
        })

        const ws = xlsx.utils.json_to_sheet(tobeExported);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'startlijst ' + bestandsnaam + '.xlsx');

        this.isExporting = false;
    }

    // Als leden-filter aan staat, dan tonen we alleen de openstaande vluchten
    filter() {
        this.filterOn = !this.filterOn;
        this.opvragen();
    }
}
