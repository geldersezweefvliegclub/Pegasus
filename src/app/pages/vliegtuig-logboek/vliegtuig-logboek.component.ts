import {Component, OnInit, ViewChild} from '@angular/core';
import {VliegtuigEditorComponent} from "../../shared/components/editors/vliegtuig-editor/vliegtuig-editor.component";
import {HeliosVliegtuig, HeliosVliegtuigenDataset, HeliosVliegtuigLogboekTotalen} from "../../types/Helios";
import {ColDef, RowDoubleClickedEvent} from "ag-grid-community";
import {CustomError, nummerSort, tijdSort} from "../../types/Utils";
import {ZitplaatsRenderComponent} from "../vliegtuigen-grid/zitplaats-render/zitplaats-render.component";
import {CheckboxRenderComponent} from "../../shared/components/datatable/checkbox-render/checkbox-render.component";
import {DeleteActionComponent} from "../../shared/components/datatable/delete-action/delete-action.component";
import {RestoreActionComponent} from "../../shared/components/datatable/restore-action/restore-action.component";
import {faClock, IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faBookmark, faCalendarDay, faClipboardList, faPlane, faPlaneDeparture} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../services/apiservice/login.service";
import * as xlsx from "xlsx";
import {StartlijstService} from "../../services/apiservice/startlijst.service";
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {SharedService} from "../../services/shared/shared.service";
import {VliegerRenderComponent} from "../startlijst-grid/vlieger-render/vlieger-render.component";
import {InzittendeRenderComponent} from "../startlijst-grid/inzittende-render/inzittende-render.component";
import {StarttijdRenderComponent} from "../startlijst-grid/starttijd-render/starttijd-render.component";
import {LandingstijdRenderComponent} from "../startlijst-grid/landingstijd-render/landingstijd-render.component";
import {DatumRenderComponent} from "../../shared/render/datum-render/datum-render.component";
import {VliegtuigenService} from "../../services/apiservice/vliegtuigen.service";
import {ChartDataSets, ChartOptions, ChartType} from "chart.js";
import {Label} from "ng2-charts";
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-vliegtuig-logboek',
  templateUrl: './vliegtuig-logboek.component.html',
  styleUrls: ['./vliegtuig-logboek.component.scss']
})
export class VliegtuigLogboekComponent implements OnInit {
  data:HeliosVliegtuigenDataset[] = [];
  totalen: HeliosVliegtuigLogboekTotalen;
  vliegtuig: HeliosVliegtuig;

  planeDepartureIcon: IconDefinition = faPlaneDeparture;
  clockIcon: IconDefinition = faClock;
  bookmarkIcon: IconDefinition = faBookmark;

  vliegtuigID = 200;

  datumAbonnement: Subscription;
  datum: DateTime;                       // de gekozen dag in de kalender

  dataColumns: ColDef[] = [
    {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
    {field: 'DATUM', headerName: 'Datum', sortable: true, cellRenderer: 'datumRender'},
    {field: 'VLUCHTEN', headerName: 'Vluchten', sortable: true, comparator: nummerSort},
    {field: 'LIERSTARTS', headerName: 'Lierstarts', sortable: true, comparator: nummerSort},
    {field: 'SLEEPSTARTS', headerName: 'Sleepstarts', sortable: true, comparator: nummerSort},
    {field: 'VLIEGTIJD', headerName: 'Vliegtijd', sortable: true, comparator: tijdSort},
  ];

  frameworkComponents = {
    datumRender: DatumRenderComponent
  };

  columns: ColDef[] = this.dataColumns;

  iconCardIcon: IconDefinition = faClipboardList;
  error: CustomError | undefined;
  magExporten: boolean = false;

  public barChartOptions: ChartOptions = {
    responsive: true,
    // We use these empty structures as placeholders for dynamic theming.
    scales: { xAxes: [{}], yAxes: [{}] },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      }
    }
  };
  public barChartLabels: Label[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [pluginDataLabels];

  public barChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' }
  ];

  constructor(private readonly startlijstService: StartlijstService,
              private readonly vliegtuigenService: VliegtuigenService,
              private readonly loginService: LoginService,
              private readonly sharedService: SharedService) {
  }

  ngOnInit(): void {
    // de datum zoals die in de kalender gekozen is
    this.datumAbonnement = this.sharedService .kalenderMaandChange.subscribe(jaarMaand => {
      this.datum = DateTime.fromObject({
        year: jaarMaand.year,
        month: jaarMaand.month,
        day: 1
      })
      this.opvragen();
    })

    let ui = this.loginService.userInfo?.Userinfo;
    this.magExporten = (!ui?.isDDWV) ? true : false;
  }

  opvragen() {
    const startDatum:DateTime = DateTime.fromObject({year: this.datum.year, month:1, day:1});
    const eindDatum:DateTime = DateTime.fromObject({year: this.datum.year, month:12, day:31});

    this.startlijstService.getVliegtuigLogboek(this.vliegtuigID, startDatum, eindDatum).then((dataset) => {
      this.data = dataset;
    });

    this.startlijstService.getVliegtuigLogboekTotalen(this.vliegtuigID, this.datum.year).then((t) => {
      this.totalen = t;
    });

    this.vliegtuigenService.getVliegtuig(this.vliegtuigID).then((vliegtuig) => {
      this.vliegtuig = vliegtuig;
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


