import {Component, OnInit, ViewChild} from '@angular/core';
import {VliegtuigenService} from '../../services/apiservice/vliegtuigen.service';
import {ZitplaatsRenderComponent} from './zitplaats-render/zitplaats-render.component';
import {CheckboxRenderComponent} from '../../shared/components/datatable/checkbox-render/checkbox-render.component';
import {faPlane, faRecycle} from '@fortawesome/free-solid-svg-icons';
import {VliegtuigEditorComponent} from '../../shared/components/editors/vliegtuig-editor/vliegtuig-editor.component';
import {ColDef, RowDoubleClickedEvent} from 'ag-grid-community';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {DeleteActionComponent} from '../../shared/components/datatable/delete-action/delete-action.component';
import {RestoreActionComponent} from '../../shared/components/datatable/restore-action/restore-action.component';
import {HeliosVliegtuig} from '../../types/Helios';
import {CustomError, nummerSort} from '../../types/Utils';

import * as xlsx from 'xlsx';
import {UserService} from '../../services/apiservice/user.service';

@Component({
    selector: 'app-vliegtuigen-grid',
    templateUrl: './vliegtuigen-grid.component.html',
    styleUrls: ['./vliegtuigen-grid.component.scss']
})
export class VliegtuigenGridComponent implements OnInit {
    @ViewChild(VliegtuigEditorComponent) editor: VliegtuigEditorComponent;

    data = [];

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
        {field: 'TMG', headerName: 'TMG', sortable: true, cellRenderer: 'checkboxRender'}
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
        zitplaatsRender: ZitplaatsRenderComponent,
        checkboxRender: CheckboxRenderComponent,
        deleteAction: DeleteActionComponent,
        restoreAction: RestoreActionComponent
    };
    iconCardIcon: IconDefinition = faPlane;
    zoekString: string;
    zoekTimer: number;
    deleteMode: boolean = false;
    trashMode: boolean = false;
    prullenbakIcon = faRecycle;
    error: CustomError | undefined;
    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    magExporten: boolean = false;

    constructor(private readonly vliegtuigenService: VliegtuigenService, private readonly loginService: UserService) {
    }

    ngOnInit(): void {
        this.vliegtuigenService.getVliegtuigen().then((dataset) => {
            this.data = dataset;
        });

        let ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magExporten = (!ui?.isDDWV) ? true : false;
    }

    addVliegtuig(): void {
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
            this.vliegtuigenService.getVliegtuigen(this.trashMode, this.zoekString).then((dataset) => {
                this.data = dataset;
            });
        }, 400);
    }

    Toevoegen(vliegtuig: HeliosVliegtuig) {
        this.vliegtuigenService.nieuwVliegtuig(vliegtuig).then(() => {
            this.opvragen();
            this.editor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    Aanpassen(vliegtuig: HeliosVliegtuig) {
        this.vliegtuigenService.updateVliegtuig(vliegtuig).then(() => {
            this.opvragen();
            this.editor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    Verwijderen(id: number) {
        this.vliegtuigenService.deleteVliegtuig(id).then(() => {
            this.deleteMode = false;
            this.trashMode = false;
            this.kolomDefinitie();      // verwijderen van de kolom met delete icons

            this.opvragen();
            this.editor.closePopup();
        });
    }

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
}

