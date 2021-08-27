import {Component, OnInit, ViewChild} from '@angular/core';
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

import {HeliosVliegtuig, HeliosVliegtuigenDataset} from '../../types/Helios';
import {CustomError} from '../../types/Utils';

import * as xlsx from 'xlsx';
import {LoginService} from '../../services/apiservice/login.service';
import {Router} from "@angular/router";
import {nummerSort} from '../../utils/Utils';


@Component({
    selector: 'app-vliegtuigen-grid',
    templateUrl: './vliegtuigen-grid.component.html',
    styleUrls: ['./vliegtuigen-grid.component.scss']
})
export class VliegtuigenGridComponent implements OnInit {
    @ViewChild(VliegtuigEditorComponent) editor: VliegtuigEditorComponent;

    data:HeliosVliegtuigenDataset[] = [];

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

    error: CustomError | undefined;
    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    magExporten: boolean = false;

    constructor(private readonly vliegtuigenService: VliegtuigenService,
                private readonly loginService: LoginService,
                private readonly router: Router) {
    }

    ngOnInit(): void {
        // plaats de juiste kolommen in het grid
        this.kolomDefinitie();

        this.vliegtuigenService.getVliegtuigen().then((dataset) => {
            this.data = dataset;
        });

        const ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magExporten = (!ui?.isDDWV) ? true : false;
    }

    // openen van popup om de data van een nieuw vliegtuig te kunnen invoeren
    addVliegtuig(): void {
        this.editor.openPopup(null);
    }

    // openen van popup om gegevens van een bestaand vliegtuig aan te passen
    openEditor(event?: RowDoubleClickedEvent) {
        this.editor.openPopup(event?.data.ID);
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
            this.vliegtuigenService.getVliegtuigen(this.trashMode, this.zoekString).then((dataset) => {
                this.data = dataset;
            });
        }, 400);
    }

    // opslaan van de data van een nieuw vliegtuig
    Toevoegen(vliegtuig: HeliosVliegtuig) {
        this.vliegtuigenService.addVliegtuig(vliegtuig).then(() => {
            this.opvragen();
            this.editor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    // bestaand vl;iegtuig is aangepast. Opslaan van de data
    Aanpassen(vliegtuig: HeliosVliegtuig) {
        this.vliegtuigenService.updateVliegtuig(vliegtuig).then(() => {
            this.opvragen();
            this.editor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    // markeer een vliegtuig als verwijderd
    Verwijderen(id: number) {
        this.vliegtuigenService.deleteVliegtuig(id).then(() => {
            this.deleteMode = false;
            this.trashMode = false;
            this.kolomDefinitie();      // verwijderen van de kolom met delete icons

            this.opvragen();
            this.editor.closePopup();
        });
    }

    // de vliegtuig is weer terug, haal de markering 'verwijderd' weg
    Herstellen(id: number) {
        this.vliegtuigenService.restoreVliegtuig(id).then(() => {
            this.deleteMode = false;
            this.trashMode = false;
            this.kolomDefinitie();  // verwijderen van de kolom met herstel icons

            this.opvragen();
            this.editor.closePopup();
        });
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

