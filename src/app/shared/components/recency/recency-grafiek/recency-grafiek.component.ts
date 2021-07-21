import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {SharedService} from "../../../../services/shared/shared.service";
import {StartlijstService} from "../../../../services/apiservice/startlijst.service";

import {ChartDataSets, ChartOptions, ChartType} from "chart.js";
import {Label} from "ng2-charts";
import {ModalComponent} from "../../modal/modal.component";

@Component({
    selector: 'app-recency-grafiek',
    templateUrl: './recency-grafiek.component.html',
    styleUrls: ['./recency-grafiek.component.scss']
})
export class RecencyGrafiekComponent implements OnInit {
    @Input() VliegerID: number;
    @Input() naam: string;

    @ViewChild(ModalComponent) private popup: ModalComponent;

    datum: DateTime;                       // de gekozen dag in de kalender
    datumAbonnement: Subscription;

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
                    fontColor: '#878787',
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
    lineChartLabels: Label[] = []
    lineChartType: ChartType = 'line';
    lineChartLegend = false;
    lineChartPlugins = [];
    lineChartData: ChartDataSets[] = [];

    waardes: number[] = [];
    bezig: boolean = false;
    counter: number = 0;

    constructor(private readonly startlijstService: StartlijstService,
                private readonly sharedService: SharedService) {}

    ngOnInit(): void {
        let empty:any[] = [];

        for (let i=0 ; i < 24 ; i++) {
            empty.push(null)  ;
        }
        this.lineChartLabels = empty;
        this.waardes = empty;
    }

    openPopup() {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })
            this.opvragen();
        })
        this.popup.open();
    }

    async opvragen() : Promise<void> {
        let waardes = [];
        let lineChartLabels = [];

        this.bezig = true
        for (this.counter=23 ; this.counter >= 0 ; this.counter--) {
            const d = this.datum.plus({ months: -1 * this.counter});

            let maand = "";
            switch (d.month)
            {
                case 1: maand = "Jan " + d.year.toString(); break;
                case 2: maand = "Feb " + d.year.toString(); break;
                case 3: maand = "Mrt " + d.year.toString(); break;
                case 4: maand = "Apr " + d.year.toString(); break;
                case 5: maand = "Mei " + d.year.toString(); break;
                case 6: maand = "Jun " + d.year.toString(); break;
                case 7: maand = "Jul " + d.year.toString(); break;
                case 8: maand = "Aug " + d.year.toString(); break;
                case 9: maand = "Sep " + d.year.toString(); break;
                case 10: maand = "Okt " + d.year.toString(); break;
                case 11: maand = "Nov " + d.year.toString(); break;
                case 12: maand = "Dec " + d.year.toString(); break;
            }
            lineChartLabels.push(maand);

            const recency = await this.startlijstService.getRecency(this.VliegerID, d);
            waardes.push(recency.WAARDE as number);
        }
        this.bezig = false;
        this.waardes = waardes;
        this.lineChartLabels = lineChartLabels;

        const lineReeks = {
            lineTension: 0,
            backgroundColor: 'rgba(213,172,73,0.4)',
            borderColor: 'rgba(213,172,73,1)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)',

            data: this.waardes
        }
       this.lineChartData =  [ lineReeks ];


        console.log(this.waardes, this.lineChartLabels)
    }
}
