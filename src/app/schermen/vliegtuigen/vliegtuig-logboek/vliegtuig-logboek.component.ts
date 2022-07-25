import {Component, OnInit, ViewChild} from '@angular/core';
import {HeliosLogboekDataset, HeliosVliegtuig, HeliosVliegtuigLogboekTotalen} from "../../../types/Helios";
import {ColDef} from "ag-grid-community";
import {faClock, IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faBookmark, faClipboardList, faPlaneDeparture, faTimesCircle} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../../services/apiservice/login.service";
import * as xlsx from "xlsx";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {SharedService} from "../../../services/shared/shared.service";
import {DatumRenderComponent} from "../../../shared/components/datatable/datum-render/datum-render.component";
import {VliegtuigenService} from "../../../services/apiservice/vliegtuigen.service";
import {ChartDataset, ChartOptions, ChartType} from "chart.js";
import {Label} from "ng2-charts";
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {ActivatedRoute} from "@angular/router";
import {nummerSort, tijdSort} from '../../../utils/Utils';
import {ErrorMessage} from "../../../types/Utils";


@Component({
    selector: 'app-vliegtuig-logboek',
    templateUrl: './vliegtuig-logboek.component.html',
    styleUrls: ['./vliegtuig-logboek.component.scss']
})
export class VliegtuigLogboekComponent implements OnInit {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    data: HeliosLogboekDataset[] = [];
    totalen: HeliosVliegtuigLogboekTotalen;
    vliegtuig: HeliosVliegtuig = {};
    REG_CALL: string = "";

    planeDepartureIcon: IconDefinition = faPlaneDeparture;
    clockIcon: IconDefinition = faClock;
    bookmarkIcon: IconDefinition = faBookmark;
    iconCardIcon: IconDefinition = faClipboardList;
    clearChartIcon: IconDefinition = faTimesCircle;

    vliegtuigID = 200;

    private datumAbonnement: Subscription; // volg de keuze van de kalender
    datum: DateTime = DateTime.now();      // de gekozen dag

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
    error: ErrorMessage | undefined;
    magExporteren: boolean = false;
    toonGrafiek: boolean = false;

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
    barChartLabels: string[] = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    barChartType: ChartType = 'bar';
    barChartLegend = true;
    barChartPlugins = [];

    barChartData: ChartDataset[] = [];

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
    lineChartLabels: string[] = this.barChartLabels
    lineChartType: ChartType = 'line';
    lineChartLegend = true;
    lineChartPlugins = [];

    lineChartData: ChartDataset[] = [];

    /*--popup voor grafiek--*/
    DetailGrafiekTitel: string;
    toonVluchtenDetailGrafiek: boolean;
    toonVliegtijdDetailGrafiek: boolean;

    constructor(private readonly startlijstService: StartlijstService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService,
                private activatedRoute: ActivatedRoute) {
    }

    ngOnInit(): void {
        // het vliegtuig ID wordt via de url meegegeven
        this.activatedRoute.queryParams.subscribe(params => {
            this.vliegtuigID = params['vliegtuigID'];
        });

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })
            this.opvragen();
        })

        let ui = this.loginService.userInfo?.Userinfo;
        this.magExporteren = (!ui?.isDDWV && !ui?.isStarttoren) ? true : false;
        this.toonGrafiek = (!ui?.isStarttoren) ? true : false;
    }

    // Opvragen van de starts via de api
    opvragen() {
        const startDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
        const eindDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});

        this.startlijstService.getVliegtuigLogboek(this.vliegtuigID, startDatum, eindDatum).then((dataset) => {
            this.data = dataset;
        }).catch(e => {
            this.error = e;
        });

        this.startlijstService.getVliegtuigLogboekTotalen(this.vliegtuigID, this.datum.year).then((t) => {
            this.totalen = t;

            // de grafiek bevat al starts van dit jaar, dus niet nogmaals toevoegen
            const alGedaan = this.barChartData.find(reeks => reeks.label == this.datum.year.toString())

            if (!alGedaan) {
                const barReeks: ChartDataset = {
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

                const lineReeks: ChartDataset = {
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
        }).catch(e => {
            this.error = e;
        });

        // ophalen van vliegtuig starts om REG_CALL in titel te zetten
        this.vliegtuigenService.getVliegtuig(this.vliegtuigID).then((vliegtuig) => {
            this.vliegtuig = vliegtuig;

            this.REG_CALL = vliegtuig.REGISTRATIE as string;
            if (vliegtuig.CALLSIGN) {
                this.REG_CALL += ' (' + vliegtuig.CALLSIGN + ')';
            }
        }).catch(e => {
            this.error = e;
        });
    }

    // welke kleur krijgt de grafiek, voor beide grafieken dezelfde kleur
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
        return 'rgba(255,255,255,' + alpha + ')';       // na 5 kleuren is het altijd wit
    }

    // Wissen van starts, gekozen jaar blijft jaar zichtbaar (en wordt kleur 0)
    // aantal items in beide grafiek arrays zijn altijd hetzelfde
    clearGrafiekData(): void {
        // index van het gekozen jaar in de kalender
        const index = this.barChartData.findIndex((reeks => reeks.label == this.datum.year.toString()));

        if (this.barChartData.length > 0) {
            const barReeks = this.barChartData[index]                           // bewaren van grafiek starts
            barReeks.backgroundColor = this.getColor(0, 0.8)    // zet kleur 0
            this.barChartData = [barReeks];                                     // blijft nu nu 1 element over in array
        }

        if (this.lineChartData.length > 0) {
            const lineReeks = this.lineChartData[index]                         // bewaren van grafiek starts
            lineReeks.backgroundColor = this.getColor(0, 0.4);  // zet kleur 0
            lineReeks.borderColor = this.getColor(0, 1);
            this.lineChartData = [lineReeks];                                   // blijft nu nu 1 element over in array
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
        // maak een kopie, anders wordt dataset aangepast en dan gaat het later fout
        const toExcel:HeliosLogboekDataset[]  = JSON.parse(JSON.stringify(this.data));

        // Datum in juiste formaat zetten
        this.data.forEach((dag) => {
            const d = DateTime.fromSQL(dag.DATUM!);
            dag.DATUM = d.day + "-" + d.month + "-" + d.year
        })

        var ws = xlsx.utils.json_to_sheet(this.data);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'vliegtuigen ' + this.vliegtuigID + " " + this.datum.year + '.xlsx');
    }

    // Tonen van de vluchten grafiek in popup window, is beter leesbaar
    toonVluchtenDetail() {
        if (this.toonVluchtenDetailGrafiek) {
            this.toonVluchtenDetailGrafiek = false;
            this.popup.close();
        } else {
            this.DetailGrafiekTitel = 'Vluchten grafiek ' + this.REG_CALL;
            this.toonVluchtenDetailGrafiek = true;
            this.toonVliegtijdDetailGrafiek = false;

            this.popup.open();
        }
    }

    // Tonen van de vliegtijd grafiek in popup window, is beter leesbaar
    toonTijdDetail() {
        if (this.toonVliegtijdDetailGrafiek) {
            this.toonVliegtijdDetailGrafiek = false;
            this.popup.close();
        } else {
            this.DetailGrafiekTitel = 'Vliegtijd grafiek ' + this.REG_CALL;
            this.toonVluchtenDetailGrafiek = false;
            this.toonVliegtijdDetailGrafiek = true;

            this.popup.open();
        }
    }
}


