import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import {ColDef} from "ag-grid-community";
import {nummerSort} from "../../../utils/Utils";
import {ErrorMessage} from "../../../types/Utils";
import {HeliosLedenDataset, HeliosTransactiesDataset, HeliosType} from "../../../types/Helios";
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faEuroSign} from "@fortawesome/free-solid-svg-icons";
import {TransactiesService} from "../../../services/apiservice/transacties.service";
import {DateTime} from "luxon";
import {DatumtijdRenderComponent} from "../../../shared/components/datatable/datumtijd-render/datumtijd-render.component";
import {BedragRenderComponent} from "./bedrag-render/bedrag-render.component";
import {TransactieEditorComponent} from "../../../shared/components/editors/transactie-editor/transactie-editor.component";
import * as xlsx from "xlsx";
import {LoginService} from "../../../services/apiservice/login.service";
import {LedenService} from "../../../services/apiservice/leden.service";
import {OmschrijvingRenderComponent} from "./omschrijving-render/omschrijving-render.component";
import {CheckboxRenderComponent} from "../../../shared/components/datatable/checkbox-render/checkbox-render.component";
import {DatumRenderComponent} from "../../../shared/components/datatable/datum-render/datum-render.component";
import {NgbDate, NgbDateParserFormatter} from "@ng-bootstrap/ng-bootstrap";
import {NgbDateFRParserFormatter} from "../../../shared/ngb-date-fr-parser-formatter";

@Component({
    selector: 'app-transacties-grid',
    templateUrl: './transacties-grid.component.html',
    styleUrls: ['./transacties-grid.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class TransactiesGridComponent implements OnInit, OnDestroy {
    @ViewChild(TransactieEditorComponent) private editor: TransactieEditorComponent;

    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];
    filteredLeden: HeliosLedenDataset[] = [];

    private resizeSubscription: Subscription;
    private dbEventAbonnement: Subscription;
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    private datum: DateTime = DateTime.now();       // de gekozen dag

    columns: ColDef[] = [
        {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
        {
            field: 'NAAM',
            headerName: 'Naam',
            width: 150,
            sortable: true},
        {
            field: 'DATUM',
            headerName: 'Datum',
            sortable: true,
            width: 150,
            cellRenderer: 'datumtijdRender'},
        {
            field: 'VLIEGDAG',
            headerName: 'Vliegdag',
            sortable: true,
            width: 100,
            cellRenderer: 'datumRender'},
        {field: 'OMSCHRIJVING', headerName: 'Omschrijving', sortable: true,  flex:10, cellRenderer: 'omschrijvingRender'},
        {
            field: 'BEDRAG',
            headerName: 'Bedrag',
            width: 100,
            resizable: false,
            sortable: false,
            cellRenderer: 'bedragRender',
            comparator: nummerSort},
        {
            field: 'EXT_REF',
            headerName: 'Referentie',
            width: 120,
            sortable: false},
        {
            field: 'SALDO_VOOR',
            headerName: 'Saldo voor',
            width: 100,
            resizable: false,
            sortable: true,
            comparator: nummerSort},
        {
            field: 'EENHEDEN',
            headerName: 'Strippen',
            width: 100,
            resizable: false,
            sortable: true,
            comparator: nummerSort},
        {
            field: 'SALDO_NA',
            headerName: 'Saldo na',
            width: 100,
            resizable: false,
            sortable: true,
            comparator: nummerSort},
        {
            field: 'INGEVOERD',
            headerName: 'Ingevoerd door',
            width: 150,
            sortable: true},
    ];

    frameworkComponents = {
        checkboxRender: CheckboxRenderComponent,
        bedragRender: BedragRenderComponent,
        omschrijvingRender: OmschrijvingRenderComponent,
        datumtijdRender: DatumtijdRenderComponent,
        datumRender: DatumRenderComponent
    };

    transacties: HeliosTransactiesDataset[];
    vliegdag: DateTime | undefined;
    isLoading = false;

    iconCardIcon: IconDefinition = faEuroSign;

    error: ErrorMessage | undefined;
    magToevoegen = true;
    magExporteren = false;

    toonBladwijzer = false;
    lidID: number | undefined;

    timerID: number;

    constructor(private readonly loginService: LoginService,
                private readonly ledenService: LedenService,
                private readonly sharedService: SharedService,
                private readonly transactiesService: TransactiesService) {
    }

    ngOnInit(): void {
        setTimeout(() => {
            // de datum zoals die in de kalender gekozen is
            this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
                if (datum.year != 1900) {
                    // ophalen is alleen nodig als er een ander jaar gekozen is in de kalendar
                    const ophalen = ((this.transacties == undefined) || (this.datum.year != datum.year))
                    this.datum = DateTime.fromObject({
                        year: datum.year,
                        month: datum.month,
                        day: datum.day
                    })

                    if (ophalen) {
                        this.lidID = undefined;         // zet filter uit voor nieuwe datum
                        this.opvragen();
                    }
                }
            })

            // de datum zoals die in de kalender gekozen is
            this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(datum => {
                if (datum.year != 1900) {
                    // ophalen is alleen nodig als er een ander jaar gekozen is in de kalendar
                    const ophalen = ((this.transacties == undefined) || (this.datum.year != datum.year))
                    this.datum = DateTime.fromObject({
                        year: datum.year,
                        month: datum.month,
                        day: 1
                    })

                    if (ophalen) {
                        this.lidID = undefined;         // zet filter uit voor nieuwe datum
                        this.opvragen();
                    }
                }
            })

            // Als in de startlijst tabel is aangepast, moet we onze dataset ook aanpassen
            this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
                if (ev.tabel == "Startlijst") {
                    this.opvragen();
                }
            });

            // abonneer op wijziging van leden
            this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
                this.leden = (leden) ? leden : [];
                this.filterLeden()
            });

            // Roep onWindowResize aan zodra we het event ontvangen hebben
            this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
                this.onWindowResize();
            });
        }, 250);

        const ui = this.loginService.userInfo?.Userinfo;

        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV) ? true : false;
        this.magExporteren = (ui?.isBeheerder || ui?.isBeheerderDDWV) ? true : false;
    }

    ngOnDestroy() {
        if (this.dbEventAbonnement) this.dbEventAbonnement.unsubscribe();
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    // aanpassen wat we op het scherm kwijt kunnen nadat scherm groote gewijzigd is
    onWindowResize() {
        if (this.sharedService.getSchermSize() == SchermGrootte.xs) {
            this.toonBladwijzer = false;
        } else {
            this.toonBladwijzer = true;
        }
    }

    // ophalen data via de rest API
    opvragen() {
        this.isLoading = true;

        const vanDatum: DateTime = DateTime.fromObject({
            year: this.datum.year,
            month: 1,
            day: 1
        })

        const totDatum: DateTime = DateTime.fromObject({
            year: this.datum.year,
            month: 12,
            day: 31
        })

        this.transactiesService.getTransacties(this.lidID, vanDatum, totDatum, this.vliegdag).then((dataset) => {
            this.transacties = dataset;
            this.isLoading = false;

            if (this.lidID === undefined) {
                this.filterLeden();
            }
        }).catch(e => {
            this.isLoading = false;
            this.error = e;
        });
    }

    // laat in de dropdown alleen de leden zien die een transactie hebben
    filterLeden() {
        // TODO:  Check performance als transactie array gevuld is met veel records
        this.filteredLeden = this.leden.filter((l:HeliosLedenDataset) => {
            const idx = this.transacties.findIndex((t => t.LID_ID == l.ID))
            return (idx >= 0)
        });
    }

    // Openen van editor
    addTransactie() {
        this.editor.openPopup(this.lidID)
    }

    // export de huidige dataset naar excel
    exportDataset() {
        const ws = xlsx.utils.json_to_sheet(this.transacties);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'transacties ' + new Date().toJSON().slice(0, 10) + '.xlsx');
    }

    // van welk lid willen we de transacties zien
    lidGeselecteerd(id: number | undefined) {
        this.lidID = id;

        clearTimeout(this.timerID)
        this.timerID = window.setTimeout(() => this.opvragen(), 500);
    }

    // Datum van de start aanpassen
    vliegdagAanpassen($datum: NgbDate) {
        this.vliegdag = DateTime.fromObject({year: $datum.year, month: $datum.month, day: $datum.day});

        clearTimeout(this.timerID)
        this.timerID = window.setTimeout(() => this.opvragen(), 500);
    }
}
