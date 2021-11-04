import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {VliegtuigenService} from '../../services/apiservice/vliegtuigen.service';

import {faPlane, faRecycle} from '@fortawesome/free-solid-svg-icons';
import {VliegtuigEditorComponent} from '../../shared/components/editors/vliegtuig-editor/vliegtuig-editor.component';
import {ColDef, RowDoubleClickedEvent} from 'ag-grid-community';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {DeleteActionComponent} from '../../shared/components/datatable/delete-action/delete-action.component';
import {RestoreActionComponent} from '../../shared/components/datatable/restore-action/restore-action.component';
import {LogboekRenderComponent} from "../../shared/components/datatable/logboek-render/logboek-render.component";
import {ZitplaatsRenderComponent} from './zitplaats-render/zitplaats-render.component';
import {CheckboxRenderComponent} from '../../shared/components/datatable/checkbox-render/checkbox-render.component';

import {
    HeliosLogboekDataset,
    HeliosStartDataset,
    HeliosType,
    HeliosVliegtuig,
    HeliosVliegtuigenDataset
} from '../../types/Helios';
import {ErrorMessage, SuccessMessage} from '../../types/Utils';

import * as xlsx from 'xlsx';
import {LoginService} from '../../services/apiservice/login.service';
import {Router} from "@angular/router";
import {nummerSort} from '../../utils/Utils';
import {StartlijstService} from "../../services/apiservice/startlijst.service";
import {DateTime} from "luxon";
import {SharedService} from "../../services/shared/shared.service";
import {Subscription} from "rxjs";

type HeliosVliegtuigenDatasetExtended = HeliosVliegtuigenDataset & {
    toonLogboek?: boolean;
}

@Component({
    selector: 'app-vliegtuigen-grid',
    templateUrl: './vliegtuigen-grid.component.html',
    styleUrls: ['./vliegtuigen-grid.component.scss']
})
export class VliegtuigenGridComponent implements OnInit, OnDestroy {
    @ViewChild(VliegtuigEditorComponent) editor: VliegtuigEditorComponent;

    data:HeliosVliegtuigenDatasetExtended[] = [];
    logboek: HeliosLogboekDataset[] = [];
    isLoading: boolean = false;

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'REGISTRATIE', headerName: 'Registratie', sortable: true},
        {field: 'CALLSIGN', headerName: 'Callsign', sortable: true},
        {field: 'VOLGORDE', headerName: 'Volgorde', sortable: true, hide: true},
        {field: 'ZITPLAATSEN', headerName: 'Zitplaatsen', sortable: true, cellRenderer: 'zitplaatsRender'},
        {field: 'CLUBKIST', headerName: 'Clubkist', sortable: false, cellRenderer: 'checkboxRender'},
        {field: 'VLIEGTUIGTYPE', headerName: 'Type', sortable: true},
        {field: 'FLARMCODE', headerName: 'Flarm', sortable: true},
        {field: 'ZELFSTART', headerName: 'Zelfstart', sortable: true, cellRenderer: 'checkboxRender'},
        {field: 'SLEEPKIST', headerName: 'Sleepkist', sortable: true, cellRenderer: 'checkboxRender'},
        {field: 'TMG', headerName: 'TMG', sortable: true, cellRenderer: 'checkboxRender'},
        {field: 'OPMERKINGEN', headerName: 'Opmerkingen', sortable: true},
    ];

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
        suppressSizeToFit:true,
        hide: false,
        cellRenderer: 'restoreAction', headerName: '', sortable: false,
        cellRendererParams: {
            onRestoreClicked: (ID: number) => {
                this.editor.openRestorePopup(ID);
            }
        },
    }];

    // kolom om logboek te zien
    logboekColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        suppressSizeToFit:true,
        hide: false,
        cellClass: "geenDots",
        cellRenderer: 'logboekRender', headerName: 'Logboek', sortable: false,
        cellRendererParams: {
            onLogboekClicked: (ID: number) => {
                this.openVliegtuigLogboek(ID);
            }
        },
    }];

    rowClassRules = {
        'rode_regel_niet_inzetbaar': function(params: any) { return params.data.INZETBAAR === false; },
    }

    columns: ColDef[];

    frameworkComponents = {
        zitplaatsRender: ZitplaatsRenderComponent,
        checkboxRender: CheckboxRenderComponent,
        logboekRender: LogboekRenderComponent,
        deleteAction: DeleteActionComponent,
        restoreAction: RestoreActionComponent
    };
    iconCardIcon: IconDefinition = faPlane;
    prullenbakIcon: IconDefinition = faRecycle;

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om data ophalen te beperken
    deleteMode: boolean = false;        // zitten we in delete mode om vliegtuigen te kunnen verwijderen
    trashMode: boolean = false;         // zitten in restore mode om vliegtuigen te kunnen terughalen

    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    magClubkistWijzigen: boolean = false;
    magExporten: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    private dbEventAbonnement: Subscription;

    constructor(private readonly vliegtuigenService: VliegtuigenService,
                private readonly startlijstService: StartlijstService,
                private readonly loginService: LoginService,
                private readonly router: Router,
                private readonly sharedService: SharedService) {

        // Als vliegtuig is aangepast, moeten we grid opnieuw laden
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Startlijst") {
                this.opvragen();
            }
        });
    }

    ngOnInit(): void {
        // plaats de juiste kolommen in het grid
        this.kolomDefinitie();
        this.opvragen();

        const ui = this.loginService.userInfo?.Userinfo;
        this.magClubkistWijzigen = (ui?.isBeheerder! || ui?.isCIMT!);
        this.magToevoegen = (!ui?.isDDWV) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magWijzigen = (!ui?.isDDWV) ? true : false;
        this.magExporten = (!ui?.isDDWV) ? true : false;

        // Als startlijst is aangepast, moeten we grid opnieuw laden
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Vliegtuigen") {
                this.opvragen();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
    }

    // openen van popup om de data van een nieuw vliegtuig te kunnen invoeren
    addVliegtuig(): void {
        if (this.magToevoegen) {
            this.editor.openPopup(null);
        }
    }

    // openen van popup om gegevens van een bestaand vliegtuig aan te passen
    openEditor(event?: RowDoubleClickedEvent) {
        if (this.magWijzigen) {

            // clubkisten mag niet iedereen aanpassen
            if (!event?.data.CLUBKIST) {
                this.editor.openPopup(event?.data as HeliosVliegtuigenDataset);
            }
            else if (this.magClubkistWijzigen) {
                this.editor.openPopup(event?.data as HeliosVliegtuigenDataset);
            }
        }
    }

    // schakelen tussen deleteMode JA/NEE. In deleteMode kun je vliegtuigen verwijderen
    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;
        this.kolomDefinitie();
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde vliegtuigen getoond
    trashModeJaNee() {
        this.kolomDefinitie();
        this.opvragen();
    }

    // Welke kolommen moet worden getoond in het grid
    kolomDefinitie() {
        if (!this.deleteMode) {
            this.columns = this.logboekColumn.concat(this.dataColumns);
        } else {
            if (this.trashMode) {
                this.columns = this.restoreColumn.concat(this.dataColumns);
            } else {
                this.columns = this.deleteColumn.concat(this.dataColumns);
            }

        }
    }

    // Opvragen van de data via de api
    opvragen() {
        clearTimeout(this.zoekTimer);

        this.zoekTimer = window.setTimeout(() => {
            this.isLoading = true;
            this.vliegtuigenService.getVliegtuigen(this.trashMode, this.zoekString).then((dataset) => {
                this.isLoading = false;
                this.data = dataset;

                const ui = this.loginService.userInfo?.Userinfo;

                if (!ui?.isDDWV) {  // DDWV'ers mogen geen clubkist logboek zien
                    this.data.forEach((v) => v.toonLogboek = v.CLUBKIST);   // alle clubkisten mogen getoond worden voor leden
                }

                if (ui?.isBeheerder) {  // beheerders mogen alles zien
                    this.data.forEach((v) => v.toonLogboek = true);
                }
                else {
                    this.laatste6Mnd();
                }

            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        }, 400);
    }

    // vlieger mag logboek bekijken als hij laaste 6 maanden op de kist gevlogen heeft
    async laatste6Mnd() {
        const nu:DateTime = DateTime.now();

        if (this.logboek.length == 0) { // als we nog starts hebben, dan halen we ze op
            const ui = this.loginService.userInfo?.LidData;
            try {
                this.logboek = await this.startlijstService.getLogboek(ui?.ID!, nu.minus({months: 6}), nu)
            }
            catch(e) { this.error = e}
        }

        // we moeten de snelste manier gebruiken. Foreach gaat over korste array
        if (this.data.length > this.logboek.length)
        {
            // for each over de starts
            this.logboek.forEach((s) => {
                const vliegtuig = this.data.find(v => v.ID == s.VLIEGTUIG_ID);
                if (vliegtuig) { vliegtuig.toonLogboek = true; console.log(vliegtuig) }
            });
        }
        else
        {
            // for each over de vliegtuigen
            this.data.forEach((vliegtuig) => {
                const start = this.logboek.find(s => s.VLIEGTUIG_ID == vliegtuig.ID);
                if (start) { vliegtuig.toonLogboek = true; console.log(vliegtuig) }
            });
        }
    }

    // Export naar excel
    exportDataset() {
        var ws = xlsx.utils.json_to_sheet(this.data);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'vliegtuigen ' + new Date().toJSON().slice(0,10) +'.xlsx');
    }

    // wijzig de route naar vliegtuig logboek. Vliegtuig logboek is te groot voor popup
    private openVliegtuigLogboek(ID: number) {
        this.router.navigate(['/vlogboek'],{ queryParams: { vliegtuigID: ID } });
    }
}

