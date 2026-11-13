import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';

import { faBug } from '@fortawesome/free-solid-svg-icons';
import { ColDef, RowDoubleClickedEvent } from 'ag-grid-community';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { DeleteActionComponent } from '../../../shared/components/datatable/delete-action/delete-action.component';
import { RestoreActionComponent } from '../../../shared/components/datatable/restore-action/restore-action.component';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';

import * as xlsx from 'xlsx';
import { LoginService } from '../../../services/apiservice/login.service';
import { nummerSort } from '../../../utils/Utils';
import { SchermGrootte, SharedService } from '../../../services/shared/shared.service';
import { Subscription } from 'rxjs';
import { journaalFilter, JournaalService } from '../../../services/apiservice/journaal.service';
import { HeliosJournaalDataset } from '../../../types/Helios';
import { MaterieelRenderComponent } from '../materieel-render/materieel-render.component';
import { StatusRenderComponent } from '../status-render/status-render.component';
import { CategorieRenderComponent } from '../categorie-render/categorie-render.component';
import { DatumRenderComponent } from '../../../shared/components/datatable/datum-render/datum-render.component';
import { JournaalFilterComponent } from '../journaal-filter/journaal-filter.component';
import { DateTime } from 'luxon';
import { TitleRenderComponent } from '../title-render/title-render.component';
import { JournaalEditorComponent } from '../../../shared/components/editors/journaal-editor/journaal-editor.component';
import { ActivatedRoute } from '@angular/router';
import { ErrorComponent } from '../../../shared/components/error/error.component';
import { SuccessComponent } from '../../../shared/components/success/success.component';
import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';
import { DatatableComponent } from '../../../shared/components/datatable/datatable.component';
import { JournaalCardComponent } from '../../../shared/components/journaal-card/journaal-card.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { StatusButtonComponent } from '../../../shared/components/status-button/status-button.component';
import { ZoekbarComponent } from '../../../shared/components/zoekbar/zoekbar.component';
import { PopupJournaalComponent } from '../../../shared/components/popup-journaal/popup-journaal.component';

@Component({
    selector: 'app-meldingen-scherm',
    host: { class: 'scherm-pagina' },
    templateUrl: './journaal-scherm.component.html',
    styleUrls: ['./journaal-scherm.component.scss'],
    imports: [ErrorComponent, SuccessComponent, PegasusCardComponent, DatatableComponent, JournaalCardComponent, IconButtonComponent, StatusButtonComponent, ZoekbarComponent, JournaalEditorComponent, JournaalFilterComponent, PopupJournaalComponent]
})

export class JournaalSchermComponent implements OnInit, OnDestroy {
    // variablen in html formulier
    protected readonly editor = viewChild.required(JournaalEditorComponent);

    protected data:HeliosJournaalDataset[] = [];
    protected isLoading = false;
    protected toonKlein = false;                 // Klein formaat van het journaal
    protected columns: ColDef[];
    protected frameworkComponents = {
        deleteAction: DeleteActionComponent,
        restoreAction: RestoreActionComponent,
        materieelRender: MaterieelRenderComponent,
        statusRender: StatusRenderComponent,
        categorieRender: CategorieRenderComponent,
        datumRender: DatumRenderComponent,
        titleRender: TitleRenderComponent
    };
    protected iconCardIcon: IconDefinition = faBug;
    protected zoekString: string;
    protected deleteMode = false;        // zitten we in delete mode om vliegtuigen te kunnen verwijderen
    protected trashMode = false;         // zitten in restore mode om vliegtuigen te kunnen terughalen
    protected activeFilter: journaalFilter;      // geavanceerd filter via popup
    protected magToevoegen = false;
    protected magVerwijderen = false;
    protected magWijzigen = false;
    protected magExporten = false;
    protected success: SuccessMessage | undefined;
    protected error: ErrorMessage | undefined;

    // private variable voor ts script
    private readonly loginService = inject(LoginService);
    private readonly sharedService = inject(SharedService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly meldingenService = inject(JournaalService);
    private readonly filter = viewChild.required(JournaalFilterComponent);

    private dbEventAbonnement: Subscription;    // Abonneer op aanpassingen in de database
    private datumAbonnement: Subscription;      // volg de keuze van de kalender
    private maandAbonnement: Subscription;      // volg de keuze van de kalender
    private datum: DateTime = DateTime.now();           // de gekozen dag

    // Data kolommen voor het grid
    // Elke kolom kan ene comparator hebben om de kolom juist te kunnen sorteren. Elke comparator functie neemt argumenten (valueA, valueB, nodeA, nodeB, isDescending), zie AG Grid docs.
    private dataColumns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {field: 'DATUM', headerName: 'Ingevoerd', cellRenderer: 'datumRender', sortable: true},
        {field: 'MELDER', headerName: 'Melder', sortable: true},
        {field: 'STATUS', headerName: 'Status', cellRenderer: 'statusRender', sortable: true, comparator:
                (_, __, nodeA, nodeB, ___) => {
                    if (nodeA.data.STATUS_ID == nodeB.data.STATUS_ID) return 0;
                    return (nodeA.data.STATUS_ID > nodeB.data.STATUS_ID) ? 1 : -1;
                }},
        {field: 'TITEL', headerName: 'Titel', sortable: true, cellRenderer: 'titleRender'},
        {field: 'REG_CALL', headerName: 'Materieel', cellRenderer: 'materieelRender', sortable: true},
        {field: 'CATEGORIE_CODE', headerName: 'Category', cellRenderer: 'categorieRender', sortable: true, comparator:
                (_, __, nodeA, nodeB, ___) => {
                    if (nodeA.data.CATEGORIE_ID == nodeB.data.CATEGORIE_ID) return 0;
                    return (nodeA.data.CATEGORIE_ID > nodeB.data.CATEGORIE_ID) ? 1 : -1;
                }},
        {field: 'TECHNICUS', headerName: 'Technicus', sortable: true},
        {field: 'LAATSTE_AANPASSING', headerName: 'Laatste aanpassing', cellRenderer: 'datumRender', sortable: true},
    ];
    // kolom om record te verwijderen
    private deleteColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        suppressSizeToFit:true,
        hide: false,
        cellRenderer: 'deleteAction', headerName: '', sortable: false,
        cellRendererParams: {
            onDeleteClicked: (ID: number) => {
                this.editor().openVerwijderPopup(ID);
            }
        },
    }];
    // kolom om terug te kunnen terughalen
    private restoreColumn: ColDef[] = [{
        pinned: 'left',
        maxWidth: 100,
        initialWidth: 100,
        resizable: false,
        suppressSizeToFit:true,
        hide: false,
        cellRenderer: 'restoreAction', headerName: '', sortable: false,
        cellRendererParams: {
            onRestoreClicked: (ID: number) => {
                this.editor().openRestorePopup(ID);
            }
        },
    }];
    private zoekTimer: number;                  // kleine vertraging om starts ophalen te beperken
    private resizeSubscription: Subscription;

    ngOnInit(): void {
        this.activeFilter = {
            alleenVliegtuigen: false,
            alleenRollend: false,

            selectedVliegtuigen: [],
            selectedRollend: [],
            selectedCategorie: [],
            selectedStatus: []
        }

        // Als lidID is meegegeven in URL, moeten we de lidData ophalen
        this.activatedRoute.queryParams.subscribe(params => {
            if (params['vliegtuigID']) {
                this.activeFilter.selectedVliegtuigen = [ params['vliegtuigID'] ];
            }
        });

        // Op safari hebben we een korte vertraging nodig op te zorgen dat initialisatie gedaan is
        setTimeout(() => {
            // de datum zoals die in de kalender gekozen is
            this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
                // ophalen is alleen nodig als er een ander jaar gekozen is in de kalendar
                const ophalen = ((this.data === undefined) || (this.datum.year !== datum.year))
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
                    const ophalen = ((this.data === undefined) || (this.datum.year !== jaarMaand.year))
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
                if (ev.tabel === "Journaal") {
                    this.opvragen();
                }
            });
        }, 250);

        // plaats de juiste kolommen in het grid
        this.kolomDefinitie();
        this.opvragen();
        this.zetPermissie();

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(() => {
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
    private onWindowResize() {
        if(this.sharedService.getSchermSize() === SchermGrootte.xs)
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
    protected addMelding(): void {
        if (this.magToevoegen) {
            this.editor().openPopup(null);
        }
    }

    // openen van popup om gegevens van een bestaand vliegtuig aan te passen
    protected openEditor(event?: RowDoubleClickedEvent) {
        if (this.magWijzigen) {
            this.editor().openPopup(event?.data as HeliosJournaalDataset);
        }
    }

    // schakelen tussen deleteMode JA/NEE. In deleteMode kun je vliegtuigen verwijderen
    protected deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
        this.kolomDefinitie();
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde vliegtuigen getoond
    protected trashModeJaNee(actief: boolean) {
        this.trashMode = actief
        this.kolomDefinitie();
        this.opvragen();
    }

    private zetPermissie() {
        const ui = this.loginService.userInfo?.Userinfo;
        // TODO: rechtencontrole voor wijzigen van meldingen over een clubkist ontbreekt. Er was magClubkistWijzigen
        //  (isBeheerder of isCIMT), maar die werd nergens gecontroleerd. Bepalen of dit nodig is
        this.magToevoegen = (!ui?.isDDWV) ? true : false;

        if (this.sharedService.getSchermSize() < SchermGrootte.lg) {
            this.magVerwijderen = false;
            this.magWijzigen = false;
        }
        else {

            this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isCIMT) ? true : false;
            this.magWijzigen = (!ui?.isDDWV) ? true : false;
            this.magExporten = (!ui?.isDDWV) ? true : false;
        }
    }

    // Welke kolommen moet worden getoond in het grid
    private kolomDefinitie() {
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
    protected opvragen() {
        clearTimeout(this.zoekTimer);

        let startDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
        let eindDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});

        if (this.datum) {
            startDatum = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
            eindDatum = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});
        }

        this.zoekTimer = window.setTimeout(() => {
            this.isLoading = true;
            this.meldingenService.getJournaals(this.activeFilter, startDatum, eindDatum, this.zoekString, this.trashMode).then((dataset) => {
                this.isLoading = false;
                this.data = dataset;
            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        }, 400);
    }

    // Export naar excel
    protected exportDataset() {
        const ws = xlsx.utils.json_to_sheet(this.data);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'journaal ' + new Date().toJSON().slice(0,10) +'.xlsx');
    }

    // Open van het filter dialoog
    protected filterPopup() {
        this.filter().openPopup();
    }
}

