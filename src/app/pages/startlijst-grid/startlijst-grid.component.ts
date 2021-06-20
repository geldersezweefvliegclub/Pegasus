import {Component, OnInit, ViewChild} from '@angular/core';
import {StartlijstService} from '../../services/apiservice/startlijst.service';
import {CheckboxRenderComponent} from '../../shared/components/datatable/checkbox-render/checkbox-render.component';
import {faRecycle} from '@fortawesome/free-solid-svg-icons';
import {VliegtuigEditorComponent} from '../../shared/components/editors/vliegtuig-editor/vliegtuig-editor.component';
import {ColDef, RowDoubleClickedEvent} from 'ag-grid-community';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {DeleteActionComponent} from '../../shared/components/datatable/delete-action/delete-action.component';
import {RestoreActionComponent} from '../../shared/components/datatable/restore-action/restore-action.component';
import {HeliosStart, HeliosStartDataset} from '../../types/Helios';
import {CustomError, KeyValueString, nummerSort, tijdSort} from '../../types/Utils';
import * as xlsx from 'xlsx';
import {UserService} from '../../services/apiservice/user.service';
import {faClipboardList} from '@fortawesome/free-solid-svg-icons/faClipboardList';
import {NgbDateFRParserFormatter} from '../../shared/ngb-date-fr-parser-formatter';
import {DateTime} from 'luxon';
import {VliegerRenderComponent} from './vlieger-render/vlieger-render.component';
import {InzittendeRenderComponent} from './inzittende-render/inzittende-render.component';
import {faFilter} from '@fortawesome/free-solid-svg-icons/faFilter';
import {NgbCalendar, NgbDate, NgbDateParserFormatter, NgbDatepickerNavigateEvent, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {StarttijdRenderComponent} from './starttijd-render/starttijd-render.component';
import {LandingstijdRenderComponent} from './landingstijd-render/landingstijd-render.component';
import {TijdInvoerComponent} from '../../shared/components/editors/tijd-invoer/tijd-invoer.component';


@Component({
    selector: 'app-startlijst-grid',
    templateUrl: './startlijst-grid.component.html',
    styleUrls: ['./startlijst-grid.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class StartlijstGridComponent implements OnInit {
    @ViewChild(VliegtuigEditorComponent) editor: VliegtuigEditorComponent;
    @ViewChild(TijdInvoerComponent) tijdInvoerEditor: TijdInvoerComponent;

    data: [];
    vliegdagen: string = "";

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'DAGNUMMER', headerName: '#', sortable: true, },

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
            field: 'STARTTIJD', headerName: 'Starttijd', sortable: true, hide: false, cellRenderer: 'startTijdRender', comparator: tijdSort,
            cellRendererParams: {
                tijdClicked: (record: HeliosStartDataset) => {
                    this.tijdInvoerEditor.openStarttijdPopup(record);
                }
            },
        },
        {
            field: 'LANDINGSTIJD', headerName: 'Landingstijd', sortable: true, cellRenderer: 'landingsTijdRender', comparator: tijdSort,
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

    deleteColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        hide: false,
        cellRenderer: 'deleteAction', headerName: '', sortable: false,
        cellRendererParams: {
            onDeleteClicked: (ID: number) => {
                this.editor.openVerwijderPopup(ID);
            }
        },
    }];

    restoreColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
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
    zoekString: string;
    zoekTimer: number;
    deleteMode: boolean = false;
    trashMode: boolean = false;
    filterOn: boolean = false;
    prullenbakIcon = faRecycle;
    filterIcon = faFilter;
    error: CustomError | undefined;

    kalenderInput: NgbDateStruct;
    kalenderMaand: { year: number, month: number };
    vandaag = this.calendar.getToday();

    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    magExporten: boolean = false;
    magDatumKiezen: boolean = false;

    constructor(private readonly startlijstService: StartlijstService, private readonly loginService: UserService, private calendar: NgbCalendar) {
    }

    ngOnInit(): void {
        this.kalenderInput = this.vandaag;

        let ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magExporten = (!ui?.isDDWV) ? true : false;
        this.magDatumKiezen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isInstructeur || ui?.isCIMT) ? true : false;

        this.opvragen();
    }

    addStart(): void {
        this.editor.openPopup(null);
    }

    openEditor(event?: RowDoubleClickedEvent) {
        this.editor.openPopup(event?.data.ID);
    }

    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;
        this.kolomDefinitie();
    }

    trashModeJaNee() {
        this.kolomDefinitie();
        this.opvragen();
    }

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

    opvragen() {
        clearTimeout(this.zoekTimer);
        this.zoekTimer = setTimeout(() => {
            if (this.kalenderInput.year < 2000 || (this.kalenderInput.year == undefined)) {
                // geen goede datum ingave
                this.data = [];
            } else {
                let datum: DateTime = DateTime.fromObject({
                    year: this.kalenderInput.year,
                    month: this.kalenderInput.month,
                    day: this.kalenderInput.day
                })
                let queryParams: KeyValueString = {};

                if (this.filterOn) {
                    queryParams["OPEN_STARTS"] = "true"
                }

                this.startlijstService.getStarts(this.trashMode, datum, datum, this.zoekString, queryParams).then((dataset) => {
                    this.data = dataset;
                });
            }
        }, 400);
    }

    Toevoegen(start: HeliosStart) {
        this.startlijstService.nieuweStart(start).then(() => {
            this.opvragen();
            this.editor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    Aanpassen(start: HeliosStart) {
        this.startlijstService.updateStart(start).then(() => {
            this.opvragen();
            this.editor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    Verwijderen(id: number) {
        this.startlijstService.deleteStart(id).then(() => {
            this.deleteMode = false;
            this.trashMode = false;
            this.kolomDefinitie();      // verwijderen van de kolom met delete icons

            this.opvragen();
            this.editor.closePopup();
        });
    }

    Herstellen(id: number) {
        this.startlijstService.restoreStart(id).then(() => {
            this.deleteMode = false;
            this.trashMode = false;
            this.kolomDefinitie();      // verwijderen van de kolom met herstel icons

            this.opvragen();
            this.editor.closePopup();
        });
    }

    // nieuwe datum gekozen
    NieuweDatum($nweDatum: NgbDate) {
        this.opvragen();
    }

    // de kalender popup toont andere maand, ophalen vliegdagen
    KalenderAndereMaand($event: NgbDatepickerNavigateEvent) {
        this.kalenderMaand = $event.next;

        let maanden = [31, 28, 31, 30, 31, 30, 30, 31, 30, 31, 30, 31];
        let startDatum: DateTime = DateTime.fromObject({
            year: this.kalenderMaand.year,
            month: this.kalenderMaand.month,
            day: 1
        })
        let eindDatum: DateTime = DateTime.fromObject({
            year: this.kalenderMaand.year,
            month: this.kalenderMaand.month,
            day: maanden[this.kalenderMaand.month - 1]
        })

        this.startlijstService.getVliegdagen(startDatum, eindDatum).then((dataset) => {
            this.vliegdagen = JSON.stringify(dataset);
        });
    }

    // highlight de dag als er starts zijn geweest
    cssCustomDay(date: NgbDate): string {
        let datum: DateTime = DateTime.fromObject({year: date.year, month: date.month, day: date.day})

        if (this.vliegdagen.includes(datum.toISODate()))
            return "vliegdag";

        return "";
    }

    // Export naar excel
    exportDataset() {
        let datum: DateTime = DateTime.fromObject({
            year: this.kalenderInput.year,
            month: this.kalenderInput.month,
            day: this.kalenderInput.day
        })

        var ws = xlsx.utils.json_to_sheet(this.data);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'startlijst ' + datum.toISODate() + '.xlsx');
    }

    // Als filter aan staat, dan tonen we alleen de openstaande vluchten
    filter() {
        this.filterOn = !this.filterOn;
        this.opvragen();
    }

    opslaanStartTijd(start: HeliosStart) {
        this.startlijstService.startTijd(start.ID as number, start.STARTTIJD as string);
        this.opvragen();
        this.tijdInvoerEditor.closePopup();
    }

    opslaanLandingsTijd(start: HeliosStart) {
        this.startlijstService.landingsTijd(start.ID as number, start.LANDINGSTIJD as string);
        this.opvragen();
        this.tijdInvoerEditor.closePopup();
    }
}

