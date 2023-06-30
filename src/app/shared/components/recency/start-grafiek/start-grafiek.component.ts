import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {DateTime} from 'luxon';
import {SharedService} from '../../../../services/shared/shared.service';
import {StartlijstService} from '../../../../services/apiservice/startlijst.service';

import * as pluginAnnotations from 'chartjs-plugin-annotation';
import AnnotationPlugin, {AnnotationOptions, LineAnnotationOptions} from 'chartjs-plugin-annotation';
import {Chart, ChartConfiguration, ChartDataset, ChartOptions, ChartEvent, ChartType} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';

import {ModalComponent} from '../../modal/modal.component';


@Component({
    selector: 'app-start-grafiek',
    templateUrl: './start-grafiek.component.html',
    styleUrls: ['./start-grafiek.component.scss']
})

export class StartGrafiekComponent implements OnInit {
    @Input() VliegerID: number;
    @Input() naam: string;

    @ViewChild(ModalComponent) private popup: ModalComponent;

    private datumAbonnement: Subscription;  // volg de keuze van de kalender
    datum: DateTime = DateTime.now();       // de gekozen dag

    lierstarts: number[] = [];
    sleepstarts: number[] = [];
    zelfstarts: number[] = [];
    tmgstarts: number[] = [];

    bezig: boolean = false;
    counter: number = 0;


    // Teken een verticale lijn op de 1e jaargrens zodat je de jaren goed kunt onderscheiden
    JaarGrens1: AnnotationOptions =
        {
            type: 'line',
            scaleID: 'x-axis-0',
            value: '',                       // wordt later gezet
            borderColor: '#bfbebe',
            borderWidth: 1,
        }

    // Teken een sverticale lijn op de 2e jaargrens zodat je de jaren goed kunt onderscheiden
    JaarGrens2: AnnotationOptions =
        {
            type: 'line',
            scaleID: 'x-axis-0',
            value: '',                      // wordt later gezet
            borderColor: '#bfbebe',
            borderWidth: 1,
        }

    lineChartPlugins = [pluginAnnotations];
    startsLineChartLabels: string[] = []
    startsLineChartData: ChartDataset[] = [];
    startsLineChartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 20,
                right: 20,
            },
        },
        elements: {
            line: {
                tension: 0.5
            }
        },
        scales: {
            'x': {
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    color: '#9b9b9b',
                    font: {
                        family: 'Roboto, sans-serif',
                        size: 12,
                        weight: '300'
                    }
                }
            },
            "y-axis-0": {
                grid: {
                    borderDash: [6, 4],
                    color: '#9b9b9b',
                },
                ticks: {
                    stepSize: 10,
                    color: '#9b9b9b',
                    font: {
                        family: 'Roboto, sans-serif',
                        size: 12,
                        weight: '300'
                    },
                },
                beginAtZero: true
            }
        },
        plugins: {
            legend: {display: true},
            annotation: {
                annotations: [
                    this.JaarGrens1,
                    this.JaarGrens2
                ]
            }
        }
    }

    constructor(private readonly startlijstService: StartlijstService,
                private readonly sharedService: SharedService) {
        Chart.register(AnnotationPlugin);
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1
                })
            }
        });
    }

    openPopup() {
        this.opvragen();

        // zet de jaargrenzen
        this.JaarGrens1.xMin = 'Jan ' + (this.datum.year - 1).toString()
        this.JaarGrens1.xMax = this.JaarGrens1.xMin
        this.JaarGrens2.xMin = 'Jan ' + this.datum.year.toString()
        this.JaarGrens2.xMax = this.JaarGrens2.xMin

        this.popup.open();
    }

    async opvragen(): Promise<void> {
        let lineChartLabels = [];

        let lierstarts = [];
        let sleepstarts = [];
        let zelfstarts = [];
        let tmgstarts = [];

        this.bezig = true               // Indicator dat we aan het ophalen zijn, progress balk is dan zichtbaar

        for (this.counter = 0; this.counter < 24; this.counter++) {
            const d = this.datum.plus({months: -1 * (24 - this.counter - 1)});

            // labels voor de x as
            let maand = "";
            switch (d.month) {
                case 1:
                    maand = "Jan";
                    break;
                case 2:
                    maand = "Feb";
                    break;
                case 3:
                    maand = "Mrt";
                    break;
                case 4:
                    maand = "Apr";
                    break;
                case 5:
                    maand = "Mei";
                    break;
                case 6:
                    maand = "Jun";
                    break;
                case 7:
                    maand = "Jul";
                    break;
                case 8:
                    maand = "Aug";
                    break;
                case 9:
                    maand = "Sep";
                    break;
                case 10:
                    maand = "Okt";
                    break;
                case 11:
                    maand = "Nov";
                    break;
                case 12:
                    maand = "Dec";
                    break;
            }

            // toon voor januari en de allereerste maand, ook het jaartal
            if ((this.counter == 0) || (d.month == 1)) {
                maand += " " + d.year.toString();
            }

            lineChartLabels.push(maand);

            try {
                const recency = await this.startlijstService.getRecency(this.VliegerID, d);

                lierstarts.push(recency.LIERSTARTS as number);
                sleepstarts.push(recency.SLEEPSTARTS as number);
                zelfstarts.push(recency.ZELFSTARTS as number);
                tmgstarts.push(recency.TMGSTARTS as number);

            } catch (e) {
                lierstarts.push(0);
                sleepstarts.push(0);
                zelfstarts.push(0);
                tmgstarts.push(0);
            }
        }
        this.bezig = false;                         // klaar met ophalen

        this.lierstarts = lierstarts;
        this.sleepstarts = sleepstarts;
        this.zelfstarts = zelfstarts;
        this.tmgstarts = tmgstarts;

        this.startsLineChartLabels = lineChartLabels;

        const lierReeks: ChartDataset = {
            label: "Lierstarts",
            fill: false,
            backgroundColor: 'rgb(31,111,32)',
            borderColor: 'rgba(31,111,32,0.59)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)',

            data: this.lierstarts
        }
        const sleepReeks: ChartDataset = {
            label: "Sleepstarts",
            fill: false,
            backgroundColor: 'rgb(106,200,250)',
            borderColor: 'rgb(0,108,250)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)',

            data: this.sleepstarts
        }
        const zelfReeks: ChartDataset = {
            label: "Zelfstarts",
            fill: false,
            backgroundColor: 'rgb(178,178,180)',
            borderColor: 'rgb(98,97,97)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)',

            data: this.zelfstarts
        }
        const tmgReeks: ChartDataset = {
            label: "TMG starts",
            fill: false,
            backgroundColor: 'rgb(214,176,82, 0.4)',
            borderColor: 'rgba(213,172,73,0.59)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)',

            data: this.tmgstarts
        }

        this.startsLineChartData = [];
        if (Math.max.apply(null, this.lierstarts) > 0) {
            this.startsLineChartData.push(lierReeks)
        }
        if (Math.max.apply(null, this.sleepstarts) > 0) {
            this.startsLineChartData.push(sleepReeks)
        }
        if (Math.max.apply(null, this.zelfstarts) > 0) {
            this.startsLineChartData.push(zelfReeks)
        }
        if (Math.max.apply(null, this.tmgstarts) > 0) {
            this.startsLineChartData.push(tmgReeks)
        }
    }
}
