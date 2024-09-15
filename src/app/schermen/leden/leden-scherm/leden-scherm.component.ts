import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { HeliosLedenDataset, HeliosTrack } from '../../../types/Helios';
import { ColDef, RowDoubleClickedEvent } from 'ag-grid-community';
import { ErrorMessage } from '../../../types/Utils';
import {
  CheckboxRenderComponent,
} from '../../../shared/components/datatable/checkbox-render/checkbox-render.component';
import { DeleteActionComponent } from '../../../shared/components/datatable/delete-action/delete-action.component';
import { RestoreActionComponent } from '../../../shared/components/datatable/restore-action/restore-action.component';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { LoginService } from '../../../services/apiservice/login.service';
import * as xlsx from 'xlsx';
import { LedenService } from '../../../services/apiservice/leden.service';
import { AvatarRenderComponent } from '../avatar-render/avatar-render.component';
import { AdresRenderComponent } from '../adres-render/adres-render.component';
import { TelefoonRenderComponent } from '../telefoon-render/telefoon-render.component';
import { EmailRenderComponent } from '../email-render/email-render.component';
import { LedenFilterComponent } from '../../../shared/components/leden-filter/leden-filter.component';
import { SchermGrootte, SharedService } from '../../../services/shared/shared.service';
import { NaamRenderComponent } from '../naam-render/naam-render.component';
import { Router } from '@angular/router';
import { nummerSort } from '../../../utils/Utils';
import { TrackEditorComponent } from '../../../shared/components/editors/track-editor/track-editor.component';
import { TracksService } from '../../../services/apiservice/tracks.service';
import { TrackRenderComponent } from '../track-render/track-render.component';
import { DatumRenderComponent } from '../../../shared/components/datatable/datum-render/datum-render.component';
import { Subscription } from 'rxjs';
import { DatatableComponent } from '../../../shared/components/datatable/datatable.component';


@Component({
    selector: 'app-leden-grid',
    templateUrl: './leden-scherm.component.html',
    styleUrls: ['./leden-scherm.component.scss']
})
export class LedenSchermComponent implements OnInit, OnDestroy {
    @ViewChild(LedenFilterComponent) ledenFilter: LedenFilterComponent;
    @ViewChild(TrackEditorComponent) trackEditor: TrackEditorComponent;
    @ViewChild(DatatableComponent) grid: DatatableComponent;

    leden: HeliosLedenDataset[] = [];
    dataset: HeliosLedenDataset[] = [];
    isLoading = false;
    toonKlein = false;                 // Klein formaat

    private resizeSubscription: Subscription;

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {
            field: 'AVATAR',
            headerName: '',
            sortable: false,
            cellRenderer: 'avatarRender',
            initialWidth: 100,
            width: 80,
            resizable: false,
            suppressSizeToFit: true,
            cellClass: 'geenDots'
        },
        {field: 'NAAM', headerName: 'Naam', sortable: true, cellRenderer: 'naamRender'},

        {field: 'VOORNAAM', headerName: 'Voornaam', sortable: true, hide: true},
        {field: 'ACHTERNAAM', headerName: 'Achternaam', sortable: true, hide: true},
        {
            field: 'EMAIL',
            headerName: 'Email',
            sortable: false,
            cellRenderer: 'emailRender',
            width: 50,
            suppressSizeToFit: true
        },
        {field: 'ADRES', headerName: 'Adres', sortable: true, cellRenderer: 'adresRender'},
        {field: 'TELEFOON', headerName: 'Telefoon', sortable: false, cellRenderer: 'telefoonRender'},

        {field: 'MEDICAL', headerName: 'Medical', sortable: true, hide: true, cellRenderer: 'datumRender'},
        {field: 'GEBOORTE_DATUM', headerName: 'Geb datum', sortable: true, hide: true, cellRenderer: 'datumRender'},
        {field: 'LIDTYPE', headerName: 'Lidmaatschap', sortable: true, hide: true},
        {field: 'LIDNR', headerName: 'Lid nummer', sortable: true, hide: true},
        {field: 'STATUS', headerName: 'Status', sortable: true, hide: true},
        {field: 'ZUSTERCLUB', headerName: 'Club', sortable: true, hide: true},
        {field: 'TEGOED', headerName: 'Tegoed', sortable: true, hide: true},

        {field: 'BUDDY', headerName: 'Buddy', sortable: true, hide: true},
        {field: 'BUDDY2', headerName: 'Buddy', sortable: true, hide: true},

        {field: 'INLOGNAAM', headerName: 'Loginnaam', sortable: true, hide: true},
        {field: 'CIMT', headerName: 'CIMT', sortable: true, hide: true, cellRenderer: 'checkboxRender'},
        {field: 'INSTRUCTEUR', headerName: 'Instructeur', sortable: true, hide: true, cellRenderer: 'checkboxRender'},
        {field: 'LIERIST', headerName: 'Lierist', sortable: true, hide: true, cellRenderer: 'checkboxRender'},
        {field: 'STARTLEIDER', headerName: 'Startleider', sortable: true, hide: true, cellRenderer: 'checkboxRender'},
        {field: 'SLEEPVLIEGER', headerName: 'Sleepvlieger', sortable: true, hide: true, cellRenderer: 'checkboxRender'},
        {field: 'STARTTOREN', headerName: 'Starttoren', sortable: true, hide: true, cellRenderer: 'checkboxRender'},
        {field: 'ROOSTER', headerName: 'Rooster', sortable: true, hide: true, cellRenderer: 'checkboxRender'},
        {field: 'AUTH', headerName: '2 Factor', sortable: true, hide: true, cellRenderer: 'checkboxRender'},

        {field: 'DDWV_CREW', headerName: 'DDWV crew', sortable: true, hide: true, cellRenderer: 'checkboxRender'},
        {field: 'DDWV_BEHEERDER', headerName: 'DDWV beheerder', sortable: true, hide: true, cellRenderer: 'checkboxRender'},

        {field: 'BEHEERDER', headerName: 'Beheerder', sortable: true, hide: true, cellRenderer: 'checkboxRender'},
        {field: 'SLEUTEL1', headerName: 'Sleutel GeZC', sortable: true, hide: true },
        {field: 'SLEUTEL2', headerName: 'Sleutel Terlet', sortable: true, hide: true },

        {
            field: 'CLUBBLAD_POST',
            headerName: 'Clubblad post',
            sortable: false,
            hide: true,
            cellRenderer: 'checkboxRender'
        },
    ];

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
                this.router.navigate(['profiel'], {queryParams: {lidID: ID, delete: true}});
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
                this.router.navigate(['profiel'], {queryParams: {lidID: ID, restore: true}});
            }
        },
    }];

    // kolom om vlieger track aan te maken
    aanmakenTrackColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 60,
        initialWidth: 60,
        resizable: false,
        suppressSizeToFit: true,
        hide: false,
        cellClass: "geenDots",
        cellRenderer: 'trackRender', headerName: 'Tracks', sortable: false,
        cellRendererParams: {
            onTrackClicked: (LID_ID: number, NAAM: string) => {
                this.openTrackEditor(LID_ID, NAAM);
            }
        },
    }];

    columns: ColDef[];

    rowClassRules = {
        'rode_regel_startverbod': function(params: any) {return params.data.STARTVERBOD === true; },
    }

    frameworkComponents = {
        avatarRender: AvatarRenderComponent,
        naamRender: NaamRenderComponent,
        adresRender: AdresRenderComponent,
        telefoonRender: TelefoonRenderComponent,
        checkboxRender: CheckboxRenderComponent,
        emailRender: EmailRenderComponent,
        deleteAction: DeleteActionComponent,
        restoreAction: RestoreActionComponent,
        trackRender: TrackRenderComponent,
        datumRender: DatumRenderComponent
    };
    iconCardIcon: IconDefinition = faUsers;

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om starts ophalen te beperken
    deleteMode = false;        // zitten we in delete mode om leden te kunnen verwijderen
    trashMode = false;         // zitten in restore mode om leden te kunnen terughalen

    error: ErrorMessage | undefined;
    magToevoegen = false;
    magVerwijderen = false;
    magWijzigen = false;
    magExporteren = false;
    toonBulkEmail = false;
    toonBladwijzer = false;

    constructor(private readonly ledenService: LedenService,
                private readonly loginService: LoginService,
                private readonly trackService: TracksService,
                private readonly sharedService: SharedService,
                private readonly router: Router
    ) {
    }

    ngOnInit(): void {
        // plaats de juiste kolommen in het grid
        this.kolomDefinitie();
        this.opvragen();
        this.zetPermissie();

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize()
        });
    }

    ngOnDestroy(): void {
        if (this.resizeSubscription) {
            this.resizeSubscription.unsubscribe();
        }
    }

    // aanpassen wat we op het scherm kwijt kunnen nadat scherm groote gewijzigd is
    onWindowResize() {
        this.toonBladwijzer = (this.sharedService.getSchermSize() == SchermGrootte.xs) ? false : true;
        this.kolomDefinitie();
        this.zetPermissie();
    }

    zetPermissie(): void {
        const ui = this.loginService.userInfo?.Userinfo;

        if (this.sharedService.getSchermSize() < SchermGrootte.lg) {
            this.magToevoegen = false;
            this.magVerwijderen = false;
            this.magWijzigen = false;
            this.magExporteren = false;
            this.toonBulkEmail = false;
        }
        else {
            this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT) ? true : false;
            this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT) ? true : false;
            this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT) ? true : false;
            this.magExporteren = (!ui?.isDDWV && !ui?.isStarttoren) ? true : false;
            this.toonBulkEmail = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT || ui?.isRooster) ? true : false;
        }

        if ((!ui?.isBeheerder) && (!ui?.isBeheerderDDWV)) {
            if (this.loginService.userInfo?.Userinfo?.isDDWV!) {
                this.sharedService.ledenlijstFilter.leden = false;
                this.sharedService.ledenlijstFilter.ddwv = true;
            }
        }
    }

    // openen van popup om lid starts van een nieuw lid te kunnen invoeren
    addLid(): void {
        this.router.navigate(['profiel'], {queryParams: {lidID: -1}}).then();
    }

    // schakelen tussen deleteMode JA/NEE. In deleteMode kun je leden verwijderen
    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
        this.kolomDefinitie();
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde leden getoond
    trashModeJaNee(actief: boolean) {
        this.trashMode = actief;

        this.kolomDefinitie();
        this.opvragen();
    }

    // Welke kolommen moet worden getoond in het grid
    kolomDefinitie() {
        const ui = this.loginService.userInfo?.Userinfo;
        this.toonKlein = (this.sharedService.getSchermSize() < SchermGrootte.xl);

        if (!this.deleteMode) {
            if ((ui?.isInstructeur || ui?.isCIMT || ui?.isBeheerder) && this.sharedService.getSchermSize() > SchermGrootte.xs){
                this.columns = this.aanmakenTrackColumn.concat(this.dataColumns);
            }
            else {
                this.columns = this.dataColumns;
            }
        } else {
            if (this.trashMode) {
                this.columns = this.restoreColumn.concat(this.dataColumns);
            } else {
                this.columns = this.deleteColumn.concat(this.dataColumns);
            }
        }

        let kolom: ColDef;
        kolom = this.columns.find(c => c.field == "ADRES") as ColDef;
        kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.sm;

        kolom = this.columns.find(c => c.field == "CIMT") as ColDef;
        kolom.hide = (this.sharedService.getSchermSize() <= SchermGrootte.sm || ui!.isDDWV);

        kolom = this.columns.find(c => c.field == "INSTRUCTEUR") as ColDef;
        kolom.hide = (this.sharedService.getSchermSize() <= SchermGrootte.sm || ui!.isDDWV);

        kolom = this.columns.find(c => c.field == "STARTLEIDER") as ColDef;
        kolom.hide = (this.sharedService.getSchermSize() <= SchermGrootte.sm || ui!.isDDWV);

        kolom = this.columns.find(c => c.field == "LIERIST") as ColDef;
        kolom.hide = (this.sharedService.getSchermSize() <= SchermGrootte.sm || ui!.isDDWV);

        kolom = this.columns.find(c => c.field == "STATUS") as ColDef;
        if (ui?.isInstructeur || ui?.isCIMT || ui?.isBeheerder){
            kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.md;
        }
        else  {
            kolom.hide = true;
        }

        kolom = this.columns.find(c => c.field == "DDWV_CREW") as ColDef;
        if (ui?.isBeheerderDDWV || ui?.isBeheerder){
            kolom.hide = this.sharedService.getSchermSize() < SchermGrootte.xl;
        }
        else  {
            kolom.hide = true;
        }

        kolom = this.columns.find(c => c.field == "DDWV_BEHEERDER") as ColDef;
        if (ui?.isBeheerderDDWV || ui?.isBeheerder){
            kolom.hide = this.sharedService.getSchermSize() < SchermGrootte.xl;
        }
        else  {
            kolom.hide = true;
        }

        kolom = this.columns.find(c => c.field == "LIDTYPE") as ColDef;
        if (ui?.isInstructeur || ui?.isCIMT || ui?.isBeheerder || ui?.isBeheerderDDWV){
            kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.xl;
        }
        else  {
            kolom.hide = true;
        }

        kolom = this.columns.find(c => c.field == "ZUSTERCLUB") as ColDef;
        if (ui?.isInstructeur || ui?.isCIMT || ui?.isBeheerder || ui?.isBeheerderDDWV){
            kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.md;
        }
        else  {
            kolom.hide = true;
        }

        kolom = this.columns.find(c => c.field == "STATUS") as ColDef;
        if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isInstructeur || ui?.isCIMT) {
            kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.xl;
        }
        else  {
            kolom.hide = true;
        }

        kolom = this.columns.find(c => c.field == "LIDNR") as ColDef;
        if (ui?.isBeheerder) {
            kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.xl;
        }
        else  {
            kolom.hide = true;
        }

        kolom = this.columns.find(c => c.field == "TEGOED") as ColDef;
        if (ui?.isBeheerder || ui?.isBeheerderDDWV) {
            kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.md;
        }
        else  {
            kolom.hide = true;
        }
    }

    // Opvragen van de starts via de api
    opvragen() {
        clearTimeout(this.zoekTimer);

        // Wacht even de gebruiker kan nog aan het typen zijn
        this.zoekTimer = window.setTimeout(() => {
            this.isLoading = true;
            this.ledenService.getLeden(this.trashMode, this.zoekString).then((dataset) => {
                this.dataset = dataset;
                this.isLoading = false;
                this.applyFilter();
            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        }, 400);
    }

    // Open van het leden-filter dialoog
    filterPopup() {
        this.ledenFilter.openPopup();
    }

    // Er is een aanpassing gemaakt in het leden-filter dialoog. We filteren de volledige dataset tot wat nodig is
    // We hoeven dus niet terug naar de server om leden opnieuw op te halen (minder starts verkeer)
    applyFilter() {
        // leden-filter de dataset naar de lijst
        this.leden = [];
        for (let i = 0; i < this.dataset.length; i++) {
            // 600 = Student
            // 601 = Erelid
            // 602 = Lid
            // 603 = Jeugdlid
            // 604 = Private owner
            // 605 = Veteraan
            // 606 = Donateur
            let isLid = false;
            if ((this.dataset[i].LIDTYPE_ID == 600) ||
                (this.dataset[i].LIDTYPE_ID == 601) ||
                (this.dataset[i].LIDTYPE_ID == 602) ||
                (this.dataset[i].LIDTYPE_ID == 603) ||
                (this.dataset[i].LIDTYPE_ID == 604) ||
                (this.dataset[i].LIDTYPE_ID == 605) ||
                (this.dataset[i].LIDTYPE_ID == 606)) {
                isLid = true;
            }

            if (this.sharedService.ledenlijstFilter.leden && !isLid) {
                continue;
            }
            if (this.sharedService.ledenlijstFilter.wachtlijst && this.dataset[i].LIDTYPE_ID != 620) {  // 620 = wachtlijst
                continue;
            }
            if (this.sharedService.ledenlijstFilter.ddwv && this.dataset[i].LIDTYPE_ID != 625) {        // 625 = DDWV'er
                continue;
            }

            if (this.sharedService.ledenlijstFilter.startleiders && this.dataset[i].STARTLEIDER == false) {
                continue;
            }
            if (this.sharedService.ledenlijstFilter.lieristen && this.dataset[i].LIERIST == false) {
                continue;
            }
            if (this.sharedService.ledenlijstFilter.lio && this.dataset[i].LIERIST_IO == false) {
                continue;
            }
            if (this.sharedService.ledenlijstFilter.instructeurs && this.dataset[i].INSTRUCTEUR == false) {
                continue;
            }
            if (this.sharedService.ledenlijstFilter.crew && this.dataset[i].DDWV_CREW == false) {
                continue;
            }
            if (this.sharedService.ledenlijstFilter.sleepvliegers && this.dataset[i].SLEEPVLIEGER == false) {
                continue;
            }
            if (this.sharedService.ledenlijstFilter.gastenVliegers && this.dataset[i].GASTENVLIEGER == false) {
                continue;
            }

            this.leden.push(this.dataset[i]);
        }
    }

    // open de track editor om nieuwe track toe te voegen. Edit opent als popup
    private openTrackEditor(LID_ID: number, NAAM: string) {
        this.trackEditor.openPopup(null, LID_ID, undefined, NAAM);
    }

    // Toevoegen van een vlieger track aan de database
    ToevoegenTrack(track: HeliosTrack): void {
        this.trackService.addTrack(track).then((t) => {});
        this.trackEditor.closePopup();
    }

    // Export naar excel
    exportDataset() {
        const ws = xlsx.utils.json_to_sheet(this.leden);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'leden ' + new Date().toJSON().slice(0, 10) + '.xlsx');
    }

    bulkEmail() {
        const ui = this.loginService.userInfo?.LidData;
        const toEmail: string  = ui!.EMAIL as string;
        let bcc="";

        this.grid.filteredRecords().forEach((lid: HeliosLedenDataset) => {
            bcc += lid.EMAIL + ","
        })

        window.location.href = `mailto:${toEmail}?bcc=${bcc}`;
    }

    // Wordt aangeroepen bij een dubbel klik op een rij.
    bewerkLid($event: RowDoubleClickedEvent) {
        const ui = this.loginService.userInfo?.Userinfo;
        if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isInstructeur || ui?.isCIMT || ui!.isRooster) {
            this.router.navigate(['profiel'], {queryParams: {lidID: $event.data.ID}});
        }
    }
}
