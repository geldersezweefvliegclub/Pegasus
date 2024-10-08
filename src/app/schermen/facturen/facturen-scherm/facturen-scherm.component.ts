import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HeliosFacturenDataset } from '../../../types/Helios';
import { Subscription } from 'rxjs';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { nummerSort } from '../../../utils/Utils';
import { DeleteActionComponent } from '../../../shared/components/datatable/delete-action/delete-action.component';
import { RestoreActionComponent } from '../../../shared/components/datatable/restore-action/restore-action.component';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import { LoginService } from '../../../services/apiservice/login.service';
import * as xlsx from 'xlsx';
import { FacturenService } from '../../../services/apiservice/facturen.service';
import { SharedService } from '../../../services/shared/shared.service';
import { TypeRenderComponent } from './type-render/type-render.component';
import { DatatableComponent } from '../../../shared/components/datatable/datatable.component';
import { LeeftijdRenderComponent } from './leeftijd-render/leeftijd-render.component';
import { GefactureerdRenderComponent } from './gefactureerd-render/gefactureerd-render.component';
import { UploadenComponent } from './uploaden/uploaden.component';

@Component({
  selector: 'app-facturen-scherm',
  templateUrl: './facturen-scherm.component.html',
  styleUrls: ['./facturen-scherm.component.scss']
})
export class FacturenSchermComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent) grid: DatatableComponent;
  @ViewChild(UploadenComponent) private uploaden: UploadenComponent;

  data:HeliosFacturenDataset[] = [];
  facturenData:HeliosFacturenDataset[] = [];
  teDoenData:HeliosFacturenDataset[] = [];
  isLoading = false;

  private dbEventAbonnement: Subscription;    // Abonneer op aanpassingen in de database
  private datumAbonnement: Subscription;      // volg de keuze van de kalender
  private maandAbonnement: Subscription;      // volg de keuze van de kalender
  jaar = 1900;                        // gekozen jaar
  mode = 'facturen';                  // welke mode is actief

  dataColumns: ColDef[] = [
    {field: 'ID', headerName: 'ID',  sortable: true, hide: true, comparator: nummerSort},
    {field: 'LIDNR', headerName: 'Lid nummer', sortable: true},
    {field: 'FACTUUR_NUMMER', headerName: 'Factuur nummer', sortable: true},
    {field: 'OMSCHRIJVING', headerName: 'Omschrijving', sortable: true},
    {field: 'GEFACTUREERD', headerName: 'Gefactureerd', cellRenderer:'gefactureerdRender', sortable: true}
  ];

  teDoenColumns: ColDef[] = [
    {field: 'NAAM', headerName: 'Naam', headerCheckboxSelection:true, checkboxSelection: true, sortable: true},
    {field: 'LIDMAATSCHAP', headerName: 'Lidmaatschap', cellRenderer:'typeRender',  sortable: true},
    {field: 'CONTRIBUTIE', headerName: 'Contributie', cellRenderer:'typeRender', sortable: true},
    {field: 'ID', headerName: 'ID',  sortable: true, hide: true, comparator: nummerSort},
    {field: 'LEEFTIJD', headerName: 'LEEFTIJD', cellRenderer:'leeftijdRender', sortable: true},
    {field: 'LIDNR', headerName: 'Lid nummer', sortable: true},
    {field: 'FACTUUR_NUMMER', headerName: 'Factuur nummer', sortable: true},
    {field: 'OMSCHRIJVING', headerName: 'Omschrijving', sortable: true},
    {field: 'GEFACTUREERD', headerName: 'Gefactureerd', cellRenderer:'gefactureerdRender', sortable: true}
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
        if (ID != null) {
          this.facturenService.deleteFactuur(ID).catch((e) => this.error = e)
        }
      }
    },
  }];

  naamColumn: ColDef[] = [
    {field: 'NAAM', headerName: 'Naam',  sortable: true}
  ]

  naamSelColumn: ColDef[] = [
    {field: 'NAAM', headerName: 'Naam', headerCheckboxSelection:true, checkboxSelection: true, sortable: true}
  ]

  columns: ColDef[];

  rowClassRules = {
    'rode_regel_niet_inzetbaar': (params: RowClassParams) => !params.data.LIDNR || params.data.OPGEZEGD,
  }

  frameworkComponents = {
    deleteAction: DeleteActionComponent,
    restoreAction: RestoreActionComponent,
    typeRender: TypeRenderComponent,
    leeftijdRender: LeeftijdRenderComponent,
    gefactureerdRender: GefactureerdRenderComponent
  };
  iconCardIcon: IconDefinition = faLayerGroup;

  zoekString: string;
  zoekTimer: number;                  // kleine vertraging om starts ophalen te beperken
  deleteMode = false;        // zitten we in delete mode om facturen te kunnen verwijderen

  magToevoegen = false;
  magVerwijderen = false;
  magWijzigen = false;
  magExporten = false;

  success: SuccessMessage | undefined;
  error: ErrorMessage | undefined;

  constructor(private readonly loginService: LoginService,
              private readonly sharedService: SharedService,
              private readonly facturenService: FacturenService) {

  }

  ngOnInit(): void {
    // Op safari hebben we een korte vertraging nodig op te zorgen dat initialisatie gedaan is
    setTimeout(() => {
      // de datum zoals die in de kalender gekozen is
      this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
        // ophalen is alleen nodig als er een ander jaar gekozen is in de kalendar
        const ophalen = ((this.data === undefined) || (this.jaar !== datum.year))
        this.jaar = datum.year;
        if (ophalen) {
          this.data = [];
          this.opvragen();
        }
      });

      // de datum zoals die in de kalender gekozen is
      this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
        if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
          // ophalen is alleen nodig als er een ander jaar gekozen is in de kalendar
          const ophalen = ((this.data === undefined) || (this.jaar !== jaarMaand.year))
          this.jaar = jaarMaand.year;
          if (ophalen) {
            this.data = [];
            this.opvragen();
          }
        }
      })

      this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
        if (ev.tabel === "Facturen") {
          this.opvragen();
        }
      });
    }, 250);

    // plaats de juiste kolommen in het grid
    this.kolomDefinitie();
    this.opvragen();
    this.zetPermissie();
  }

  ngOnDestroy(): void {
    if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
    if (this.maandAbonnement)       this.maandAbonnement.unsubscribe();
    if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
  }

  // schakelen tussen deleteMode JA/NEE. In deleteMode kun je vliegtuigen verwijderen
  deleteModeJaNee() {
    this.deleteMode = !this.deleteMode;
    this.kolomDefinitie();
  }

  zetPermissie() {
    const ui = this.loginService.userInfo?.Userinfo;
    this.magToevoegen = (ui?.isBeheerder) ? true : false;
    this.magVerwijderen = (ui?.isBeheerder) ? true : false;
    this.magWijzigen = (ui?.isBeheerder) ? true : false;
    this.magExporten = (ui?.isBeheerder) ? true : false;
  }

  // Welke kolommen moet worden getoond in het grid
  kolomDefinitie() {
    if (!this.deleteMode) {
      if (this.mode === 'facturen') {
        this.columns = this.naamSelColumn.concat(this.dataColumns);
      }
      else {
        this.columns = this.teDoenColumns;
      }
    } else {
      this.columns = this.deleteColumn.concat(this.naamColumn.concat(this.dataColumns));
    }
  }

  // Opvragen van de starts via de api
  opvragen() {
    clearTimeout(this.zoekTimer);

    this.zoekTimer = window.setTimeout(() => {
      this.isLoading = true;
      this.facturenService.getFacturen(this.jaar, this.zoekString).then((dataset) => {
        this.isLoading = false;

        this.facturenData = dataset;

        if (this.mode === 'facturen') {
            this.data = dataset;
        }
      }).catch(e => {
        this.isLoading = false;
        this.error = e;
      });

      this.facturenService.nogTeFactureren(this.jaar).then((dataset) => {
        this.teDoenData = dataset

        if (this.mode === 'nogTeDoen') {
          this.data = dataset;
        }
      }).catch(e => {
        this.isLoading = false;
        this.error = e;
      });
    }, 400);
  }

  // Export naar excel
  exportDataset() {
    const ws = xlsx.utils.json_to_sheet(this.data);
    const wb: xlsx.WorkBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
    xlsx.writeFile(wb, 'facturen ' + new Date().toJSON().slice(0,10) +'.xlsx');
  }

  modeSwitch() {
    this.deleteMode = false;
    if (this.mode === 'facturen')
    {
      this.mode = 'nogTeDoen';
      this.data = this.teDoenData;
    }
    else {
      this.mode = 'facturen';
      this.data = this.facturenData;
    }
    this.kolomDefinitie()
  }

  maakFacturen() {
    const IDs: number[] = [];

    this.grid.selectedRecords().forEach(row => {
        if ((row.LIDNR) && (row.GEFACTUREERD == null || row.GEFACTUREERD == undefined)) {
          IDs.push(row.LID_ID);
        }
    })

    this.facturenService.aanmakenFacturen (this.jaar, IDs).then(() => {
      this.success = {titel:"Facturen",beschrijving: IDs.length + " facturen aangemaakt"}
      this.modeSwitch();
      this.opvragen();
    }).catch(e => {
      this.error = e;
    });
  }

  uploadenFacturen() {
    const IDs: number[] = [];

    this.grid.selectedRecords().forEach(row => {
      if (row.ID && !row.FACTUUR_NUMMER) {
        IDs.push(row.ID);
      }
    })

    if (IDs.length > 0) {
      this.uploaden.showPopupAndUpload(IDs);
    }
  }
}


