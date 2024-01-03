import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {faBug, faRecycle} from '@fortawesome/free-solid-svg-icons';
import {ColDef, RowDoubleClickedEvent} from 'ag-grid-community';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {DeleteActionComponent} from '../../../shared/components/datatable/delete-action/delete-action.component';
import {RestoreActionComponent} from '../../../shared/components/datatable/restore-action/restore-action.component';
import {ErrorMessage, SuccessMessage} from '../../../types/Utils';

import * as xlsx from 'xlsx';
import {LoginService} from '../../../services/apiservice/login.service';
import {Router} from "@angular/router";
import {nummerSort} from '../../../utils/Utils';
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {Subscription} from "rxjs";
import {journaalFilter, JournaalService} from "../../../services/apiservice/journaal.service";
import {HeliosJournaalDataset} from "../../../types/Helios";
import {MaterieelRenderComponent} from "../materieel-render/materieel-render.component";
import {StatusRenderComponent} from "../status-render/status-render.component";
import {CategorieRenderComponent} from "../categorie-render/categorie-render.component";
import {DatumRenderComponent} from "../../../shared/components/datatable/datum-render/datum-render.component";
import {JournaalFilterComponent} from "../journaal-filter/journaal-filter.component";
import {DateTime} from "luxon";
import {TitleRenderComponent} from "../title-render/title-render.component";
import {JournaalEditorComponent} from "../../../shared/components/editors/journaal-editor/journaal-editor.component";


@Component({
    selector: 'app-meldingen-scherm',
    templateUrl: './journaal-scherm.component.html',
    styleUrls: ['./journaal-scherm.component.scss']
})

export class JournaalSchermComponent implements OnInit, OnDestroy {
    @ViewChild(JournaalFilterComponent) private filter: JournaalFilterComponent;
    @ViewChild(JournaalEditorComponent) editor: JournaalEditorComponent;

    data:HeliosJournaalDataset[] = [];
    isLoading: boolean = false;
    toonKlein: boolean = false;                 // Klein formaat van het journaal

    private dbEventAbonnement: Subscription;    // Abonneer op aanpassingen in de database
    private datumAbonnement: Subscription;      // volg de keuze van de kalender
    private maandAbonnement: Subscription;      // volg de keuze van de kalender
    datum: DateTime = DateTime.now();           // de gekozen dag

    dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'DATUM', headerName: 'Ingevoerd', cellRenderer: 'datumRender', sortable: true},
        {field: 'MELDER', headerName: 'Melder', sortable: true},
        {field: 'STATUS', headerName: 'Status', cellRenderer: 'statusRender', sortable: true, comparator:
                (valueA, valueB, nodeA, nodeB, isDescending) => {
                    if (nodeA.data.STATUS_ID == nodeB.data.STATUS_ID) return 0;
                    return (nodeA.data.STATUS_ID > nodeB.data.STATUS_ID) ? 1 : -1;
                }},
        {field: 'TITEL', headerName: 'Titel', sortable: true, cellRenderer: 'titleRender'},
        {field: 'REG_CALL', headerName: 'Materieel', cellRenderer: 'materieelRender', sortable: true},
        {field: 'CATEGORIE_CODE', headerName: 'Category', cellRenderer: 'categorieRender', sortable: true, comparator:
                (valueA, valueB, nodeA, nodeB, isDescending) => {
                    if (nodeA.data.CATEGORIE_ID == nodeB.data.CATEGORIE_ID) return 0;
                    return (nodeA.data.CATEGORIE_ID > nodeB.data.CATEGORIE_ID) ? 1 : -1;
                }},
        {field: 'TECHNICUS', headerName: 'Technicus', sortable: true},
        {field: 'LAATSTE_AANPASSING', headerName: 'Laatste aanpassing', cellRenderer: 'datumRender', sortable: true},
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

    columns: ColDef[];

    frameworkComponents = {
        deleteAction: DeleteActionComponent,
        restoreAction: RestoreActionComponent,
        materieelRender: MaterieelRenderComponent,
        statusRender: StatusRenderComponent,
        categorieRender: CategorieRenderComponent,
        datumRender: DatumRenderComponent,
        titleRender: TitleRenderComponent
    };
    iconCardIcon: IconDefinition = faBug;
    prullenbakIcon: IconDefinition = faRecycle;

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om starts ophalen te beperken
    deleteMode: boolean = false;        // zitten we in delete mode om vliegtuigen te kunnen verwijderen
    trashMode: boolean = false;         // zitten in restore mode om vliegtuigen te kunnen terughalen

    activeFilter: journaalFilter;      // geavanceerd filter via popup

    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    magClubkistWijzigen: boolean = false;
    magExporten: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)

    constructor(private readonly loginService: LoginService,
                private readonly sharedService: SharedService,
                private readonly meldingenService: JournaalService) {

    }

    ngOnInit(): void {
        this.activeFilter = {
            alleenVliegtuigen: false,
            alleenRollend: false,

            selectedVliegtuigen: [],
            selectedRollend: [],
            selectedCategorie: [],
            selectedStatus: []
        }

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

            this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
                if (ev.tabel == "Journaal") {
                    this.opvragen();
                }
            });
        }, 250);

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
        if (this.resizeSubscription)    this.resizeSubscription.unsubscribe();
        if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
        if (this.maandAbonnement)       this.maandAbonnement.unsubscribe();
        if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
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

    // openen van popup om nieuwe melding te kunnen invoeren
    addMelding(): void {
        if (this.magToevoegen) {
            this.editor.openPopup(null);
        }
    }

    // openen van popup om gegevens van een bestaand vliegtuig aan te passen
    openEditor(event?: RowDoubleClickedEvent) {
        if (this.magWijzigen) {
            this.editor.openPopup(event?.data as HeliosJournaalDataset);
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
        this.magToevoegen = (!ui?.isDDWV) ? true : false;

        if (this.sharedService.getSchermSize() < SchermGrootte.lg) {
            this.magVerwijderen = false;
            this.magWijzigen = false;
        }
        else {
            this.magClubkistWijzigen = (ui?.isBeheerder! || ui?.isCIMT!);

            this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT) ? true : false;
            this.magWijzigen = (!ui?.isDDWV) ? true : false;
            this.magExporten = (!ui?.isDDWV) ? true : false;
        }
    }

    // Welke kolommen moet worden getoond in het grid
    kolomDefinitie() {
        this.toonKlein = (this.sharedService.getSchermSize() < SchermGrootte.xl);

        if (!this.deleteMode) {
            this.columns = this.dataColumns;
        } else {
            if (this.trashMode) {
                this.columns = this.restoreColumn.concat(this.dataColumns);
            } else {
                this.columns = this.deleteColumn.concat(this.dataColumns);
            }
        }
    }

    // Opvragen van de starts via de api
    opvragen() {
        clearTimeout(this.zoekTimer);

        let startDatum: DateTime = DateTime.fromObject({year: DateTime.now().year, month: 1, day: 1});
        let eindDatum: DateTime = DateTime.fromObject({year: DateTime.now().year, month: 12, day: 31});

        if (this.datum) {
            startDatum = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
            eindDatum = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});
        }

        this.zoekTimer = window.setTimeout(() => {
            this.isLoading = true;
            this.meldingenService.getJournaals(this.activeFilter, startDatum, eindDatum, this.zoekString, this.trashMode).then((dataset) => {
                this.isLoading = false;
                this.data = dataset;

                const ui = this.loginService.userInfo?.Userinfo;

            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        }, 400);
    }

    // Export naar excel
    exportDataset() {
        var ws = xlsx.utils.json_to_sheet(this.data);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'journaal ' + new Date().toJSON().slice(0,10) +'.xlsx');
    }

    // Open van het filter dialoog
    filterPopup() {
        this.filter.openPopup();
    }
}

