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
import {
    faBookmark,
    faCalendarDay,
    faClipboardList,
    faPlane,
    faPlaneDeparture,
    faTimesCircle
} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../services/apiservice/login.service";
import * as xlsx from "xlsx";
import {StartlijstService} from "../../services/apiservice/startlijst.service";
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {SharedService} from "../../services/shared/shared.service";
import {DatumRenderComponent} from "../../shared/components/datatable/datum-render/datum-render.component";
import {VliegtuigenService} from "../../services/apiservice/vliegtuigen.service";
import {ChartDataSets, ChartOptions, ChartType, ScaleTitleOptions} from "chart.js";
import {Color, Label} from "ng2-charts";
import {ModalComponent} from "../../shared/components/modal/modal.component";
import {ActivatedRoute} from "@angular/router";


@Component({
    selector: 'app-vliegtuig-logboek',
    templateUrl: './vliegtuig-logboek.component.html',
    styleUrls: ['./vliegtuig-logboek.component.scss']
})
export class VliegtuigLogboekComponent implements OnInit {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    data: HeliosVliegtuigenDataset[] = [];
    totalen: HeliosVliegtuigLogboekTotalen;
    vliegtuig: HeliosVliegtuig = {};

    planeDepartureIcon: IconDefinition = faPlaneDeparture;
    clockIcon: IconDefinition = faClock;
    bookmarkIcon: IconDefinition = faBookmark;
    iconCardIcon: IconDefinition = faClipboardList;
    clearChartIcon: IconDefinition = faTimesCircle;

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
    magExporten: boolean = false;

    /*-BarChart-----------*/
    barChartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 20,
                right: 20,
            },
        },
        scales: {
            xAxes: [{
                gridLines: {
                    drawOnChartArea: false
                },
                ticks: {
                    fontColor: '#e7e7e7',
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: 12,
                    fontStyle: '300'
                }
            }],
            yAxes: [{
                gridLines: {
                    borderDash: [6, 4],
                    color: '#478706',
                },
                ticks: {
                    stepSize: 10,
                    fontColor: '#e7e7e7',
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: 12,
                    fontStyle: '300',
                    beginAtZero: true
                }
            }]
        }
    };
    barChartLabels: Label[] = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    barChartType: ChartType = 'bar';
    barChartLegend = true;
    barChartPlugins = [];

    barChartData: ChartDataSets[] = [];

    /*-LineChart------------*/
    lineChartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 20,
                right: 20,
            },
        },
        scales: {
            xAxes: [{
                gridLines: {
                    drawOnChartArea: false
                },
                ticks: {
                    fontColor: '#e7e7e7',
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: 12,
                    fontStyle: '300'
                }
            }],
            yAxes: [{
                gridLines: {
                    borderDash: [6, 4],
                    color: '#548bcd',
                },
                ticks: {
                    stepSize: 10,
                    fontColor: '#e7e7e7',
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: 12,
                    fontStyle: '300',
                    beginAtZero: true
                }
            }]
        }
    };
    lineChartLabels: Label[] = this.barChartLabels
    lineChartType: ChartType = 'line';
    lineChartLegend = true;
    lineChartPlugins = [];

    lineChartData: ChartDataSets[] = [];

    /*--popup voor grafiek--*/
    DetailGrafiekTitel: string;
    toonVluchtenDetailGrafiek: boolean;
    toonVliegtijdDetailGrafiek: boolean;

    constructor(private readonly startlijstService: StartlijstService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService,
                private activatedRoute: ActivatedRoute) {

        this.activatedRoute.queryParams.subscribe(params => {
            this.vliegtuigID = params['vliegtuigID'];
        });
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
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
        const startDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
        const eindDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});

        this.startlijstService.getVliegtuigLogboek(this.vliegtuigID, startDatum, eindDatum).then((dataset) => {
            this.data = dataset;
        });

        this.startlijstService.getVliegtuigLogboekTotalen(this.vliegtuigID, this.datum.year).then((t) => {
            this.totalen = t;

            // de grafiek beval al data van dit jaar
            const alGedaan = this.barChartData.find(reeks => reeks.label == this.datum.year.toString())

            if (!alGedaan) {
                const barReeks: ChartDataSets = {
                    label: this.datum.year.toString(),
                    barThickness: 8,
                    backgroundColor: this.getColor(this.barChartData.length, 0.8),

                    data: [
                        t.dataset![0].VLUCHTEN,
                        t.dataset![1].VLUCHTEN,
                        t.dataset![2].VLUCHTEN,
                        t.dataset![3].VLUCHTEN,
                        t.dataset![4].VLUCHTEN,
                        t.dataset![5].VLUCHTEN,
                        t.dataset![6].VLUCHTEN,
                        t.dataset![7].VLUCHTEN,
                        t.dataset![8].VLUCHTEN,
                        t.dataset![9].VLUCHTEN,
                        t.dataset![10].VLUCHTEN,
                        t.dataset![11].VLUCHTEN,
                    ]
                }
                this.barChartData.push(barReeks);

                const lineReeks: ChartDataSets = {
                    label: this.datum.year.toString(),
                    lineTension: 0,
                    backgroundColor: this.getColor(this.lineChartData.length, 0.4),
                    borderColor: this.getColor(this.lineChartData.length, 1),
                    pointBackgroundColor: 'rgba(148,159,177,1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(148,159,177,0.8)',

                    data: [
                        this.Tijd2Hr(t.dataset![0].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![1].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![2].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![3].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![4].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![5].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![6].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![7].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![8].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![9].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![10].VLIEGTIJD),
                        this.Tijd2Hr(t.dataset![11].VLIEGTIJD)
                    ]
                }
                this.lineChartData.push(lineReeks);

            }
        });

        this.vliegtuigenService.getVliegtuig(this.vliegtuigID).then((vliegtuig) => {
            this.vliegtuig = vliegtuig;
        });
    }

    getColor(kleurIndex: number, alpha: number): string {
        switch (kleurIndex) {
            case 0:
                return 'rgba(213,172,73,' + alpha + ')';
            case 1:
                return 'rgba(31,111,32,' + alpha + ')';
            case 2:
                return 'rgba(45,243,243,' + alpha + ')';
            case 3:
                return 'rgba(70,115,219,' + alpha + ')';
            case 4:
                return 'rgba(51,51,0,' + alpha + ')';
        }
        return 'rgba(255,255,255,' + alpha + ')';
    }

    // Wissen van data, laatste blijft jaar zichtbaar
    clearGrafiekData(): void {
        const index = this.barChartData.findIndex((reeks => reeks.label == this.datum.year.toString()));

        if (this.barChartData.length > 0) {
            const barReeks = this.barChartData[index]
            barReeks.backgroundColor = this.getColor(0, 0.8)
            this.barChartData = [barReeks];
        }

        if (this.lineChartData.length > 0) {
            const lineReeks = this.lineChartData[index]
            lineReeks.backgroundColor = this.getColor(0, 0.4);
            lineReeks.borderColor = this.getColor(0, 1);
            this.lineChartData = [lineReeks];
        }
    }

    // hh:mm naar uren
    private Tijd2Hr(tijd: string | undefined): number {
        if (!tijd) {
            return 0;
        }

        const t: string[] = tijd.split(':');
        return Math.round(100 * (+t[0] + +t[1] / 60)) / 100;                      // +t = conversie naar number
    }

    // Export naar excel
    exportDataset() {
        var ws = xlsx.utils.json_to_sheet(this.data);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'vliegtuigen ' + new Date().toJSON().slice(0, 10) + '.xlsx');
    }

    toonVluchtenDetail() {
        this.DetailGrafiekTitel = "Vluchten grafiek";
        this.toonVluchtenDetailGrafiek = true;
        this.toonVliegtijdDetailGrafiek = false;

        this.popup.open();
    }

    toonTijdDetail() {
        this.DetailGrafiekTitel = "Vliegtijd grafiek";
        this.toonVluchtenDetailGrafiek = false;
        this.toonVliegtijdDetailGrafiek = true;

        this.popup.open();
    }
}


