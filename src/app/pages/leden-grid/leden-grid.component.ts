import {Component, ViewChild} from '@angular/core';
import {faRecycle, faUsers} from '@fortawesome/free-solid-svg-icons';
import {VliegtuigEditorComponent} from '../../shared/components/editors/vliegtuig-editor/vliegtuig-editor.component';
import {HeliosLedenDataset, HeliosLid} from '../../types/Helios';
import {ColDef, RowDoubleClickedEvent} from 'ag-grid-community';
import {CustomError, nummerSort} from '../../types/Utils';
import {CheckboxRenderComponent} from '../../shared/components/datatable/checkbox-render/checkbox-render.component';
import {DeleteActionComponent} from '../../shared/components/datatable/delete-action/delete-action.component';
import {RestoreActionComponent} from '../../shared/components/datatable/restore-action/restore-action.component';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {LoginService} from '../../services/apiservice/login.service';
import * as xlsx from 'xlsx';
import {LedenService} from '../../services/apiservice/leden.service';
import {AvatarRenderComponent} from './avatar/avatar-render.component';
import {AdresRenderComponent} from './adres-render/adres-render.component';
import {TelefoonRenderComponent} from './telefoon-render/telefoon-render.component';
import {EmailRenderComponent} from './email-render/email-render.component';
import {FilterComponent} from './filter/filter.component';
import {SharedService} from '../../services/shared/shared.service';


@Component({
    selector: 'app-leden-grid',
    templateUrl: './leden-grid.component.html',
    styleUrls: ['./leden-grid.component.scss']
})
export class LedenGridComponent {
    @ViewChild(FilterComponent) ledenFilter: FilterComponent;
    @ViewChild(VliegtuigEditorComponent) editor: VliegtuigEditorComponent;      // TODO

    leden: HeliosLedenDataset[] = [];
    dataset: HeliosLedenDataset[] = [];

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {
            field: 'AVATAR',
            headerName: '',
            sortable: false,
            cellRenderer: 'avatarRender',
            initialWidth:  100,
            width: 110,
            resizable: false,
            suppressSizeToFit:true,
            cellClass: "geenDots"},
        {field: 'NAAM', headerName: 'Naam', sortable: true},

        {field: 'VOORNAAM', headerName: 'Voornaam', sortable: true, hide: true},
        {field: 'ACHTERNAAM', headerName: 'Achternaam', sortable: true, hide: true},
        {
            field: 'EMAIL',
            headerName: 'Email',
            sortable: false,
            cellRenderer: 'emailRender',
            width: 50,
            suppressSizeToFit:true
        },
        {field: 'ADRES', headerName: 'Adres', sortable: true, cellRenderer: 'adresRender'},
        {field: 'TELEFOON', headerName: 'Telefoon', sortable: false, cellRenderer: 'telefoonRender'},

        {field: 'LIDTYPE', headerName: 'Lidmaatschap', sortable: true, hide: true},
        {field: 'ZUSTERCLUB', headerName: 'Club', sortable: true, hide: true},

        {field: 'INSTRUCTEUR', headerName: 'Instructeur', sortable: true, cellRenderer: 'checkboxRender'},
        {field: 'LIERIST', headerName: 'Lierist', sortable: true, cellRenderer: 'checkboxRender'},
        {field: 'STARTLEIDER', headerName: 'Startleider', sortable: true, cellRenderer: 'checkboxRender'},
        {field: 'DDWV_CREW', headerName: 'DDWV crew', sortable: true, hide: true, cellRenderer: 'checkboxRender'},

        {
            field: 'CLUBBLAD_POST',
            headerName: 'Clubblad post',
            sortable: false,
            hide: true,
            cellRenderer: 'checkboxRender'
        },
    ];

    columns: ColDef[] = this.dataColumns;

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

    frameworkComponents = {
        avatarRender: AvatarRenderComponent,
        adresRender: AdresRenderComponent,
        telefoonRender: TelefoonRenderComponent,
        checkboxRender: CheckboxRenderComponent,
        emailRender: EmailRenderComponent,
        deleteAction: DeleteActionComponent,
        restoreAction: RestoreActionComponent
    };
    iconCardIcon: IconDefinition = faUsers;
    prullenbakIcon: IconDefinition = faRecycle;

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om data ophalen te beperken
    deleteMode: boolean = false;        // zitten we in delete mode om leden te kunnen verwijderen
    trashMode: boolean = false;         // zitten in restore mode om leden te kunnen terughalen

    error: CustomError | undefined;
    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    magExporten: boolean = false;

    constructor(private readonly ledenService: LedenService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        // plaats de juiste kolommen in het grid
        this.kolomDefinitie();
        this.opvragen();

        const ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magExporten = (!ui?.isDDWV) ? true : false;
    }

    // openen van popup om lid data van een nieuw lid te kunnen invoeren
    addLid(): void {
        this.editor.openPopup(null);
    }

    // openen van popup om gegevens van een bestaand lid aan te passen
    openEditor(event?: RowDoubleClickedEvent) {
        this.editor.openPopup(event?.data.ID);
    }

    // schakelen tussen deleteMode JA/NEE. In deleteMode kun je leden verwijderen
    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;
        this.kolomDefinitie();
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde leden getoond
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
        clearTimeout(this.zoekTimer);

        // Wacht even de gebruiker kan nog aan het typen zijn
        this.zoekTimer = window.setTimeout(() => {
            this.ledenService.getLeden(this.trashMode, this.zoekString).then((dataset) => {
                this.dataset = dataset;
                this.applyFilter();
            });
        }, 400);
    }

    // Mooi, we hebben een nieuw lid ingevoerd. Opslaan van de data
    Toevoegen(lid: HeliosLid) {
        this.ledenService.nieuwLid(lid).then(() => {
            this.opvragen();
            this.editor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    // De data van een bestaand lid is aangepast. Opslaan van de data
    Aanpassen(lid: HeliosLid) {
        this.ledenService.updateLid(lid).then(() => {
            this.opvragen();
            this.editor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    // Minder mooi, lid is geen lid meer. Markeer lid als verwijderd
    Verwijderen(id: number) {
        this.ledenService.deleteLid(id).then(() => {
            this.deleteMode = false;
            this.trashMode = false;
            this.kolomDefinitie();      // verwijderen van de kolom met delete icons

            this.opvragen();
            this.editor.closePopup();
        });
    }

    // Gelukkig, een oud lid is opnieuw lid geworden. Haal de verwijderd markering weg.
    Herstellen(id: number) {
        this.ledenService.restoreLid(id).then(() => {
            this.deleteMode = false;
            this.trashMode = false;
            this.kolomDefinitie();  // verwijderen van de kolom met herstel icons

            this.opvragen();
            this.editor.closePopup();
        });
    }

    // Open van het filter dialoog
    filterPopup() {
        this.ledenFilter.openPopup();
    }

    // Er is een aanpassing gemaakt in het filter dialoog. We filteren de volledige dataset tot wat nodig is
    // We hoeven dus niet terug naar de server om data opnieuw op te halen (minder data verkeer)
    applyFilter() {
        // filter de dataset naar de lijst
        this.leden = [];
        for (let i = 0; i < this.dataset.length; i++) {

            // 601 = Erelid
            // 602 = Lid
            // 603 = Jeugdlid
            // 606 = Donateur
            let isLid = false;
            if ((this.dataset[i].LIDTYPE_ID == 601) ||
                (this.dataset[i].LIDTYPE_ID == 602) ||
                (this.dataset[i].LIDTYPE_ID == 603) ||
                (this.dataset[i].LIDTYPE_ID == 606)) {
                isLid = true;
            }

            if (this.sharedService.ledenlijstFilter.leden && !isLid) continue;
            if (this.sharedService.ledenlijstFilter.ddwv && this.dataset[i].LIDTYPE_ID != 625) continue;
            if (this.sharedService.ledenlijstFilter.startleiders && this.dataset[i].STARTLEIDER == false) continue;
            if (this.sharedService.ledenlijstFilter.lieristen && this.dataset[i].LIERIST == false) continue;
            if (this.sharedService.ledenlijstFilter.instructeurs && this.dataset[i].INSTRUCTEUR == false) continue;
            if (this.sharedService.ledenlijstFilter.crew && this.dataset[i].DDWV_CREW == false) continue;

            this.leden.push(this.dataset[i]);
        }
    }

    // Export naar excel
    exportDataset() {
        let ws = xlsx.utils.json_to_sheet(this.leden);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'vliegtuigen ' + new Date().toJSON().slice(0, 10) + '.xlsx');
    }
}
