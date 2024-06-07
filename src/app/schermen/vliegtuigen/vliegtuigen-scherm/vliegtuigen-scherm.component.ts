import {Component, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {VliegtuigenService} from '../../../services/apiservice/vliegtuigen.service';

import {faPlane, faRecycle} from '@fortawesome/free-solid-svg-icons';
import {VliegtuigEditorComponent} from '../../../shared/components/editors/vliegtuig-editor/vliegtuig-editor.component';
import {ColDef, RowDoubleClickedEvent} from 'ag-grid-community';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {DeleteActionComponent} from '../../../shared/components/datatable/delete-action/delete-action.component';
import {RestoreActionComponent} from '../../../shared/components/datatable/restore-action/restore-action.component';
import {IconRenderComponent} from "../icon-render/icon-render.component";
import {ZitplaatsRenderComponent} from '../zitplaats-render/zitplaats-render.component';
import {HandboekRenderComponent} from '../handboek-render/handboek-render.component';
import {CheckboxRenderComponent} from '../../../shared/components/datatable/checkbox-render/checkbox-render.component';

import {HeliosLogboekDataset, HeliosVliegtuigenDataset} from '../../../types/Helios';
import {ErrorMessage, SuccessMessage} from '../../../types/Utils';

import * as xlsx from 'xlsx';
import {LoginService} from '../../../services/apiservice/login.service';
import {Router} from "@angular/router";
import {nummerSort} from '../../../utils/Utils';
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {DateTime} from "luxon";
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {Subscription} from "rxjs";
import {PopupJournaalComponent} from "../../../shared/components/popup-journaal/popup-journaal.component";

export type HeliosVliegtuigenDatasetExtended = HeliosVliegtuigenDataset & {
    toonLogboek?: boolean;
    toonJournaal?: boolean;
    magWijzigen?: boolean;
}

@Component({
    selector: 'app-vliegtuigen-grid',
    templateUrl: './vliegtuigen-scherm.component.html',
    styleUrls: ['./vliegtuigen-scherm.component.scss']
})
export class VliegtuigenSchermComponent implements OnInit, OnDestroy {
    @ViewChild(VliegtuigEditorComponent) editor: VliegtuigEditorComponent;
    @ViewChild(PopupJournaalComponent) journaal: PopupJournaalComponent;

    data:HeliosVliegtuigenDatasetExtended[] = [];
    logboek: HeliosLogboekDataset[] = [];
    isLoading: boolean = false;
    toonKlein: boolean = false;                 // Klein formaat van het scherm

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'REGISTRATIE', headerName: 'Registratie', cellRenderer: 'handboekRender', sortable: true},
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
    iconColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        suppressSizeToFit:true,
        hide: false,
        cellClass: "geenDots",
        cellRenderer: 'iconRender', headerName: 'Icons', sortable: false,
        cellRendererParams: {
            onLogboekClicked: (ID: number) => {
                this.openVliegtuigLogboek(ID);
            },
            onJournaalClicked: (ID: number) => {
                this.openVliegtuigJournaal(ID);
            }
        },
    }];

    rowClassRules = {
        'rode_regel_niet_inzetbaar': function(params: any) { return params.data.INZETBAAR === false; },
    }

    columns: ColDef[];

    frameworkComponents = {
        zitplaatsRender: ZitplaatsRenderComponent,
        handboekRender: HandboekRenderComponent,
        checkboxRender: CheckboxRenderComponent,
        iconRender: IconRenderComponent,
        deleteAction: DeleteActionComponent,
        restoreAction: RestoreActionComponent
    };
    iconCardIcon: IconDefinition = faPlane;
    prullenbakIcon: IconDefinition = faRecycle;

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om starts ophalen te beperken
    deleteMode: boolean = false;        // zitten we in delete mode om vliegtuigen te kunnen verwijderen
    trashMode: boolean = false;         // zitten in restore mode om vliegtuigen te kunnen terughalen

    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    magClubkistWijzigen: boolean = false;
    magExporten: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    private dbEventAbonnement: Subscription;        // Abonneer op aanpassingen in de database
    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)

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
        this.zetPermissie();

        // Als startlijst is aangepast, moeten we grid opnieuw laden
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Vliegtuigen") {
                this.opvragen();
            }
        });

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize()
        });
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
        if (this.resizeSubscription)    this.resizeSubscription.unsubscribe();
    }

    // aanpassen wat we op het scherm kwijt kunnen nadat scherm groote gewijzigd is
    onWindowResize() {
        if(this.sharedService.getSchermSize() == SchermGrootte.xs)
        {
            this.kolomDefinitie();
            this.zetPermissie();
        }
        else
        {
            this.kolomDefinitie();
            this.zetPermissie();
        }
    }

    // openen van popup om de starts van een nieuw vliegtuig te kunnen invoeren
    addVliegtuig(): void {
        if (this.magToevoegen) {
            this.editor.openPopup(null);
        }
    }

    // openen van popup om gegevens van een bestaand vliegtuig aan te passen
    dbClickVliegtuig(event?: RowDoubleClickedEvent) {
        const vliegtuig = event?.data as HeliosVliegtuigenDataset;
        this.OpenEditor(vliegtuig);
    }

    OpenEditor(vliegtuig: HeliosVliegtuigenDataset)
    {
        if (this.magWijzigen) {
            // clubkisten mag niet iedereen aanpassen
            if (!vliegtuig.CLUBKIST) {
                this.editor.openPopup(vliegtuig);
            }
            else if (this.magClubkistWijzigen) {
                this.editor.openPopup(vliegtuig);
            }
        }
    }

    // schakelen tussen deleteMode JA/NEE. In deleteMode kun je vliegtuigen verwijderen
    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
        this.kolomDefinitie();
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde vliegtuigen getoond
    trashModeJaNee(actief: boolean) {
        this.trashMode = actief
        this.kolomDefinitie();
        this.opvragen();
    }

    zetPermissie() {
        const ui = this.loginService.userInfo?.Userinfo;

        this.magClubkistWijzigen = (ui?.isBeheerder! || ui?.isCIMT!);
        this.magWijzigen = (!ui?.isDDWV) ? true : false;

        if (this.sharedService.getSchermSize() < SchermGrootte.xl) {
            this.magExporten = false;
            this.magVerwijderen = false;
            this.magToevoegen = false;
        }
        else {
            this.magToevoegen = (!ui?.isDDWV) ? true : false;
            this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT) ? true : false;
            this.magExporten = (!ui?.isDDWV) ? true : false;
        }
    }

    // Welke kolommen moet worden getoond in het grid
    kolomDefinitie() {
        this.toonKlein = (this.sharedService.getSchermSize() < SchermGrootte.xl);

        if (!this.deleteMode) {
            this.columns = this.iconColumn.concat(this.dataColumns);
        } else {
            if (this.trashMode) {
                this.columns = this.restoreColumn.concat(this.dataColumns);
            } else {
                this.columns = this.deleteColumn.concat(this.dataColumns);
            }
        }

        let kolom: ColDef;
        kolom = this.columns.find(c => c.field == "CLUBKIST") as ColDef;
        kolom.hide = this.sharedService.getSchermSize() == SchermGrootte.xs;

        kolom = this.columns.find(c => c.field == "FLARMCODE") as ColDef;
        kolom.hide = this.sharedService.getSchermSize() <= SchermGrootte.md;

        kolom = this.columns.find(c => c.field == "ZELFSTART") as ColDef;
        kolom.hide = this.sharedService.getSchermSize() == SchermGrootte.xs;

        kolom = this.columns.find(c => c.field == "SLEEPKIST") as ColDef;
        kolom.hide = this.sharedService.getSchermSize() == SchermGrootte.xs;

        kolom = this.columns.find(c => c.field == "TMG") as ColDef;
        kolom.hide = this.sharedService.getSchermSize() == SchermGrootte.xs;

        kolom = this.columns.find(c => c.field == "OPMERKINGEN") as ColDef;
        kolom.hide = this.sharedService.getSchermSize() == SchermGrootte.xs;
    }

    // Opvragen van de starts via de api
    opvragen() {
        clearTimeout(this.zoekTimer);

        this.zoekTimer = window.setTimeout(() => {
            this.isLoading = true;
            this.vliegtuigenService.getVliegtuigen(this.trashMode, this.zoekString).then((dataset) => {
                this.isLoading = false;
                this.data = dataset;

                const ui = this.loginService.userInfo?.Userinfo;

                this.data.forEach((v) => {
                    v.toonJournaal = (ui?.isDDWV) ? false : v.CLUBKIST

                    if (ui?.isDDWV) {
                        v.toonLogboek = false;  // DDWV'ers mogen geen clubkist logboek zien
                    }
                    if (ui?.isBeheerder || v.CLUBKIST) {
                        v.toonLogboek = true;   // alle logboeken zichtbaar voor beheerder, logboek voor clubkisten zijn openbaar
                    }
                    v.magWijzigen = (ui?.isBeheerder || !v.CLUBKIST) ? true : false;
                });
                this.laatste6Mnd();


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
                const vliegtuig = this.data.find(v => (v.ID == s.VLIEGTUIG_ID) && s.STARTTIJD);
                if (vliegtuig) { vliegtuig.toonLogboek = true; }
            });
        }
        else
        {
            // for each over de vliegtuigen
            this.data.forEach((vliegtuig) => {
                const start = this.logboek.find(s => (s.VLIEGTUIG_ID == vliegtuig.ID) && s.STARTTIJD);
                if (start) { vliegtuig.toonLogboek = true; }
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
    public openVliegtuigLogboek(ID: number) {
        this.router.navigate(['/vliegtuigen/vlogboek'],{ queryParams: { vliegtuigID: ID } });
    }

    public openVliegtuigJournaal(ID: number) {
        this.journaal.showPopup(ID);
    }
}

