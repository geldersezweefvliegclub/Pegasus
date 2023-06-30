import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {DateTime} from 'luxon';
import {SharedService} from '../../../../services/shared/shared.service';
import {StartlijstService} from '../../../../services/apiservice/startlijst.service';

import * as pluginAnnotations from 'chartjs-plugin-annotation';
import AnnotationPlugin, {AnnotationOptions} from 'chartjs-plugin-annotation';
import {Chart, ChartConfiguration, ChartDataset, ChartOptions} from 'chart.js';

import {ModalComponent} from '../../modal/modal.component';


@Component({
    selector: 'app-recency-grafiek',
    templateUrl: './recency-grafiek.component.html',
    styleUrls: ['./recency-grafiek.component.scss']
})

export class RecencyGrafiekComponent implements OnInit {
    @Input() VliegerID: number;
    @Input() naam: string;

    @ViewChild(ModalComponent) private popup: ModalComponent;

    private datumAbonnement: Subscription;  // volg de keuze van de kalender
    datum: DateTime = DateTime.now();       // de gekozen dag

    waardes: number[] = [];
    bezig: boolean = false;
    counter: number = 0;

    // De rode zone tekenen in de grafiek
    RodeBalk: AnnotationOptions =
        {
            type: 'box',
            yScaleID: 'y-axis-0',
            xMin: 0,
            xMax: 100,
            yMin: 0,
            yMax: 10,
            backgroundColor: 'rgba(220,53,69,0.75)',
        };

    // De gele zone tekenen in de grafiek
    GeleBalk: AnnotationOptions =
        {
            type: 'box',
            yScaleID: 'y-axis-0',
            xMin: 0,
            xMax: 100,
            yMin: 10,
            yMax: 20,
            backgroundColor: 'rgba(255,193,7,0.75)',
        }

    // De groene zone tekenen in de grafiek
    GroeneBalk: AnnotationOptions =
        {
            type: 'box',
            yScaleID: 'y-axis-0',
            xMin: 0,
            xMax: 100,
            yMin: 20,
            yMax: 30,

            backgroundColor: 'rgba(40,167,69,0.75)',
        }

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

    // alle opties voor het tekenen van de lijn
    lineChartOptions: ChartOptions = {
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
                    color: '#878787',
                    font: {
                        family: 'Roboto, sans-serif',
                        size: 12,
                        weight: '300'
                    },
                }
            },
            'y-axis-0': {
                beginAtZero: true,
                grid: {
                    borderDash: [6, 4],
                    color: '#548bcd',
                },
                ticks: {
                    stepSize: 10,
                    color: '#e7e7e7',
                    font: {
                        family: 'Roboto, sans-serif',
                        size: 12,
                        weight: '300',
                    },

                }
            }
        },
        plugins: {
            legend: {display: false},
            annotation: {
                /*
                common: {
                    drawTime: "beforeDatasetsDraw"
                }, */
                annotations: [
                    this.RodeBalk,
                    this.GeleBalk,
                    this.GroeneBalk,
                    this.JaarGrens1,
                    this.JaarGrens2
                ]
            }
        }
    }

    lineChartPlugins = [pluginAnnotations];
    lineChartData: ChartConfiguration['data'] = {
        datasets: [
            {
                data: [],                                       // wordt later gevuld
                backgroundColor: 'rgba(148,159,177,0.2)',
                borderColor: 'rgb(79,75,75)',
                pointBackgroundColor: 'rgba(148,159,177,1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(148,159,177,0.8)',
            },
        ],
        labels: []                                              // wordt later gevuld
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
        let waardes = [];
        let lineChartLabels = [];

        this.bezig = true               // Indicator dat we aan het ophalen zijn, progress balk is dan zichtbaar
        let maxWaarde: number = 30;     // indien de vlieger een waarde heeft < 30, dan is 30 minimum, de groene, gele, rode balk zijn dan even hoog

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
                waardes.push(recency.WAARDE as number);

                // de maximale waarde die de grafiek heeft
                if (recency.WAARDE as number > maxWaarde) {
                    maxWaarde = recency.WAARDE as number;
                }
            } catch (e) {
                waardes.push(0);
            }
        }
        this.bezig = false;                         // klaar met ophalen
        if (this.GroeneBalk.type === "box") {       // aanpassen groene schaal
            this.GroeneBalk.yMax = Math.ceil(maxWaarde / 10) * 10;    // afronden naar boven in tientallen 70 - 80 - 90
        }

        //  this.waardes = waardes;
        //this.lineChartLabels = lineChartLabels;

        this.lineChartData.datasets[0].data = waardes;
        this.lineChartData.labels = lineChartLabels;

        const lineReeks: ChartDataset = {

            borderColor: 'rgba(42,42,42,0.59)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)',

            data: this.waardes,
        }
    }
}
