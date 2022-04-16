import {Component, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {StartlijstService} from '../../services/apiservice/startlijst.service';
import {CheckboxRenderComponent} from '../../shared/components/datatable/checkbox-render/checkbox-render.component';
import {faDownload} from '@fortawesome/free-solid-svg-icons';
import {faClipboardList} from '@fortawesome/free-solid-svg-icons/faClipboardList';
import {ColDef, RowDoubleClickedEvent} from 'ag-grid-community';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {DeleteActionComponent} from '../../shared/components/datatable/delete-action/delete-action.component';
import {RestoreActionComponent} from '../../shared/components/datatable/restore-action/restore-action.component';
import {HeliosDienstenDataset, HeliosRoosterDataset, HeliosStartDataset} from '../../types/Helios';
import {ErrorMessage, KeyValueArray, SuccessMessage} from '../../types/Utils';
import * as xlsx from 'xlsx';
import {LoginService} from '../../services/apiservice/login.service';
import {DateTime, Interval} from 'luxon';
import {StarttijdRenderComponent} from '../../shared/components/datatable/starttijd-render/starttijd-render.component';
import {LandingstijdRenderComponent} from '../../shared/components/datatable/landingstijd-render/landingstijd-render.component';
import {TijdInvoerComponent} from '../../shared/components/editors/tijd-invoer/tijd-invoer.component';
import {StartEditorComponent} from '../../shared/components/editors/start-editor/start-editor.component';
import {Subscription} from 'rxjs';
import {SchermGrootte, SharedService} from '../../services/shared/shared.service';
import {nummerSort, tijdSort} from '../../utils/Utils';
import {ExportStartlijstComponent} from "./export-startlijst/export-startlijst.component";
import {RoosterService} from "../../services/apiservice/rooster.service";
import {DienstenService} from "../../services/apiservice/diensten.service";
import {PegasusConfigService} from "../../services/shared/pegasus-config.service";
import {VoorinRenderComponent} from "./voorin-render/voorin-render.component";
import {AchterinRenderComponent} from "./achterin-render/achterin-render.component";
import {DagnummerRenderComponent} from "./dagnummer-render/dagnummer-render.component";

type HeliosStartDatasetExtended = HeliosStartDataset & {
    inTijdspan?: boolean
}

@Component({
    selector: 'app-startlijst-grid',
    templateUrl: './vluchten-grid.component.html',
    styleUrls: ['./vluchten-grid.component.scss']
})
export class VluchtenGridComponent implements OnInit, OnDestroy {
    @ViewChild(StartEditorComponent) editor: StartEditorComponent;
    @ViewChild(TijdInvoerComponent) tijdInvoerEditor: TijdInvoerComponent;
    @ViewChild(ExportStartlijstComponent) exportStartlijstKeuze: ExportStartlijstComponent;

    data: HeliosStartDatasetExtended[] = [];
    isLoading: boolean = false;
    isStarttoren: boolean = false;
    isExporting: boolean = false;

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'DAGNUMMER', headerName: '#', cellRenderer: 'dagnummerRender', sortable: true,},
        {field: 'REGISTRATIE', headerName: 'Registratie', sortable: true, hide: true, enableRowGroup: true},
        {field: 'CALLSIGN', headerName: 'Callsign', sortable: true, hide: true, enableRowGroup: true},
        {field: 'REG_CALL', headerName: 'RegCall', sortable: true, enableRowGroup: true},
        {field: 'VLIEGTUIGTYPE', headerName: 'Type', sortable: true, hide: this.isStarttoren},
        {field: 'VELD', headerName: 'Veld', sortable: true, hide: true},
        {field: 'CHECKSTART', headerName: 'Trainingsvlucht', hide: true, sortable: true, cellRenderer: 'checkboxRender'},
        {field: 'CLUBKIST', headerName: 'Clubkist', sortable: true, cellRenderer: 'checkboxRender', hide: true},
        {
            field: 'VLIEGERNAAM_LID',
            headerName: 'Voorin',
            sortable: true,
            enableRowGroup: true,
            cellRenderer: 'voorinRender'
        },
        {
            field: 'INZITTENDENAAM_LID',
            headerName: 'Achterin',
            sortable: true,
            enableRowGroup: true,
            cellRenderer: 'achterinRender'
        },
        {field: 'STARTMETHODE', headerName: 'Start methode', sortable: true, hide: false, enableRowGroup: true},
        {
            field: 'STARTTIJD',
            headerName: 'Starttijd',
            sortable: true,
            hide: false,
            cellRenderer: 'startTijdRender',
            comparator: tijdSort,
            cellRendererParams: {
                tijdClicked: (record: HeliosStartDataset) => {
                    if (!this.deleteMode && this.inTijdspan)
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
                    if (!this.deleteMode && this.inTijdspan)
                        this.tijdInvoerEditor.openLandingsTijdPopup(record);
                }
            },
        },
        {field: 'DUUR', headerName: 'Duur', sortable: true, comparator: tijdSort},
        {field: 'VLIEGTUIG_ID', headerName: 'Vliegtuig ID', sortable: true, hide: true},
        {field: 'STARTMETHODE_ID', headerName: 'Startmethode ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'VLIEGER_ID', headerName: 'Vlieger ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'INZITTENDE_ID', headerName: 'Inzittende ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'SLEEPKIST_ID', headerName: 'Sleepkist ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'SLEEP_HOOGTE', headerName: 'Sleep hoogte', sortable: true, hide: true, comparator: nummerSort},
        {field: 'OPMERKINGEN', headerName: 'Opmerkingen', sortable: true},
    ];

    rowClassRules = {
        'start_niet_wijzigbaar': function(params: any) { return !params.data.inTijdspan; },
    }

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
        dagnummerRender: DagnummerRenderComponent,
        voorinRender: VoorinRenderComponent,
        achterinRender: AchterinRenderComponent,
        startTijdRender: StarttijdRenderComponent,
        landingsTijdRender: LandingstijdRenderComponent,
        checkboxRender: CheckboxRenderComponent,
        deleteAction: DeleteActionComponent,
        restoreAction: RestoreActionComponent
    };
    iconCardIcon: IconDefinition = faClipboardList;
    downloadIcon: IconDefinition = faDownload;

    private dbEventAbonnement: Subscription;
    private dienstenAbonnement: Subscription;
    private roosterAbonnement: Subscription;
    rooster: HeliosRoosterDataset[];
    diensten: HeliosDienstenDataset[];

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om data ophalen te beperken
    refreshTimer: number;
    deleteMode: boolean = false;        // zitten we in delete mode om starts te kunnen verwijderen
    trashMode: boolean = false;         // zitten in restore mode om starts te kunnen terughalen

    filterOn: boolean = false;
    toonRefresh: boolean = true;
    toonStartlijstKlein: boolean = false;     // Klein formaat van de startlijst

    private datumAbonnement: Subscription; // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag in de kalender

    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    inTijdspan: boolean = false;          //  Mogen we starts aanpassen. Mag niet in de toekomst en ook niet meer dan xx dagen geleden.  xx is geconfigureerd in pegasus.config
    magExporteren: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    VliegerID: number | undefined = undefined;

    constructor(private readonly startlijstService: StartlijstService,
                private readonly loginService: LoginService,
                private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService,
                private readonly configService: PegasusConfigService,
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

            const ui = this.loginService.userInfo?.Userinfo;
            const nu:  DateTime = DateTime.now()

            this.isStarttoren = ui!.isStarttoren as boolean;

            if (datum.year*10000+datum.month*100+datum.day > nu.year*10000+nu.month*100+nu.day) {
                this.inTijdspan = false;    // datum is in de toekomst
            }
            else {
                const diff = Interval.fromDateTimes(datum, nu);
                if (diff.length("days") > this.configService.maxZelfEditDagen()) {
                    this.inTijdspan = ui?.isBeheerder!;     // alleen beheerder mag na xx dagen wijzigen. xx is geconfigureerd in pegasus.config
                }
                else {
                    this.inTijdspan = true;                 // zitten nog binnen de termijn
                }
            }
            this.opvragen();
            this.magVerwijderen = (!this.beperkteInvoer()) ? true : false;
        });

        // abonneer op wijziging van diensten
        this.dienstenAbonnement = this.dienstenService.dienstenChange.subscribe(diensten => {
            this.diensten = (diensten) ? diensten : [];
            this.beperkteInvoer();
        });

        // abonneer op wijziging van rooster
        this.roosterAbonnement = this.roosterService.roosterChange.subscribe(rooster => {
            this.rooster = (rooster) ? rooster : [];
            this.beperkteInvoer();
        });

        // Als startlijst is aangepast, moeten we grid opnieuw laden
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Startlijst") {
                this.opvragen();
            }
        });

        const ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT || ui?.isInstructeur || ui?.isDDWV || ui?.isClubVlieger) ? true : false;
        this.magVerwijderen = (!this.beperkteInvoer()) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT || ui?.isInstructeur || ui?.isDDWV || ui?.isClubVlieger) ? true : false;
        this.magExporteren = (!ui?.isDDWV && !ui?.isStarttoren);
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
        if (this.roosterAbonnement)     this.roosterAbonnement.unsubscribe();
        if (this.dienstenAbonnement)    this.dienstenAbonnement.unsubscribe();
        if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();

        clearTimeout(this.refreshTimer);
    }

    // mag de ingelogde gebruiker starts voor iedereen invullen of alleen voor zichzelf
    beperkteInvoer(): boolean {
        this.VliegerID = this.loginService.userInfo?.LidData?.ID;   // als VliegerID gezet is, mogen we alleen voor onszelf invoeren
        const ui = this.loginService.userInfo?.Userinfo;

        if (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT || ui?.isStarttoren) {
            this.VliegerID = undefined;
        } else if (this.rooster) {
            const d = this.datum.toSQL().substr(0, 10);
            const rooster: HeliosRoosterDataset | undefined = this.rooster.find((dag) => d == dag.DATUM)

            if (rooster) {
                if (rooster.DDWV)               // het is een DWWV dag, misschien toch alles tonen
                {
                    if (ui?.isBeheerderDDWV) {  // Beheerder DDWV mag op DDWV dag alles kunnen invoeren
                        this.VliegerID = undefined;
                    } else {
                        const diensten: HeliosDienstenDataset[] | undefined = this.diensten.filter((dag) => d == dag.DATUM)

                        if (diensten) {
                            diensten.forEach(dienst => {
                                if (dienst.LID_ID == this.loginService.userInfo?.LidData?.ID) { // de ingelode gebruiker had dienst, alles kunnen invoeren
                                    this.VliegerID = undefined;
                                }
                            });
                        }
                    }
                }
            }
        }
        return (this.VliegerID == this.loginService.userInfo?.LidData?.ID)
    }

    // openen van popup om nieuwe start te kunnen invoeren
    addStart(): void {
        if (this.magToevoegen) {
            this.editor.openPopup(null);
        }
    }

    // openen van popup om bestaande start te kunnen aanpassen
    openEditor(event?: RowDoubleClickedEvent) {
        if (this.magWijzigen && !this.deleteMode && this.inTijdspan) {
            this.editor.openPopup(event?.data);
        }
    }

    // schakelen tussen deleteMode JA/NEE. In deleteMode kun je starts verwijderen
    deleteModeJaNee() {
        if (this.magVerwijderen) {
            this.deleteMode = !this.deleteMode;

            if (!this.deleteMode) {
                this.trashMode = false;
            }
            this.kolomDefinitie();
            this.opvragen();
        }
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde starts getoond
    trashModeJaNee(actief: boolean) {
        this.trashMode = actief

        this.kolomDefinitie();
        this.opvragen();
    }

    @HostListener('window:resize', ['$event'])
    onWindowResize() {
        this.kolomDefinitie();
    }


    // Welke kolommen moet worden getoond in het grid
    kolomDefinitie() {
        this.toonStartlijstKlein = (this.sharedService.getSchermSize() < SchermGrootte.xl);
        this.toonRefresh = (this.sharedService.getSchermSize() != SchermGrootte.xs);

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
        clearTimeout(this.refreshTimer);

        if (this.filterOn) {
            queryParams["OPEN_STARTS"] = "true"
        }

        this.isLoading = true;
        this.startlijstService.getStarts(this.trashMode, this.datum, this.datum, this.zoekString, queryParams).then((dataset) => {
            this.data = (dataset) ? dataset : [];
            for (let i = 0; i < this.data.length; i++) {
                this.data[i].inTijdspan = this.inTijdspan;
            }
            this.isLoading = false;
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });

        this.refreshTimer = window.setTimeout(() => this.opvragen(), 1000 * 60 * 5);  // iedere 5 minuten
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
    filter(actief: boolean) {
        this.filterOn = actief;
        this.opvragen();
    }
}
