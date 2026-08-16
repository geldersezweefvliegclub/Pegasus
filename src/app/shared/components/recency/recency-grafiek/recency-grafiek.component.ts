import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { DateTime } from 'luxon';
import { SharedService } from '../../../../services/shared/shared.service';
import { StartlijstService } from '../../../../services/apiservice/startlijst.service';

import AnnotationPlugin, { AnnotationOptions, BoxLabelOptions } from 'chartjs-plugin-annotation';
import { ChartConfiguration, ChartOptions } from 'chart.js';

import { ModalComponent } from '../../modal/modal.component';
import { NgbProgressbar } from '@ng-bootstrap/ng-bootstrap';
import { BaseChartDirective } from 'ng2-charts';


@Component({
    selector: 'app-recency-grafiek',
    templateUrl: './recency-grafiek.component.html',
    styleUrls: ['./recency-grafiek.component.scss'],
    imports: [ModalComponent, NgbProgressbar, BaseChartDirective]
})

export class RecencyGrafiekComponent implements OnInit {
    @Input() VliegerID: number;
    @Input() naam: string;

    @ViewChild(ModalComponent) private popup: ModalComponent;

    private datumAbonnement: Subscription;  // volg de keuze van de kalender
    datum: DateTime = DateTime.now();       // de gekozen dag

    waardes: number[] = [];
    bezig = false;
    counter = 0;

    // De rode zone tekenen in de grafiek
    RodeBalk: AnnotationOptions =
        {
            type: 'box',
            yScaleID: 'y',
            yMin: 0,
            yMax: 10,
            backgroundColor: 'rgba(220,53,69,0.75)',
            label: {display: false, content: null, callout: {display: false}} as unknown as BoxLabelOptions,
        };

    // De gele zone tekenen in de grafiek
    GeleBalk: AnnotationOptions =
        {
            type: 'box',
            yScaleID: 'y',
            yMin: 10,
            yMax: 20,
            backgroundColor: 'rgba(255,193,7,0.75)',
            label: {display: false, content: null, callout: {display: false}} as unknown as BoxLabelOptions,
        }

    // De groene zone tekenen in de grafiek
    GroeneBalk: AnnotationOptions =
        {
            type: 'box',
            yScaleID: 'y',
            yMin: 20,
            yMax: 30,

            backgroundColor: 'rgba(40,167,69,0.75)',
            label: {display: false, content: null, callout: {display: false}} as unknown as BoxLabelOptions,
        }

    // Teken een verticale lijn op de 1e jaargrens zodat je de jaren goed kunt onderscheiden
    JaarGrens1: AnnotationOptions =
        {
            type: 'line',
            scaleID: 'x',
            value: '',                       // wordt later gezet
            borderColor: '#bfbebe',
            borderWidth: 1,
            label: {display: false, content: null},
        }

    // Teken een sverticale lijn op de 2e jaargrens zodat je de jaren goed kunt onderscheiden
    JaarGrens2: AnnotationOptions =
        {
            type: 'line',
            scaleID: 'x',
            value: '',                      // wordt later gezet
            borderColor: '#bfbebe',
            borderWidth: 1,
            label: {display: false, content: null},
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
                        weight: 300
                    },
                }
            },
            'y': {
                beginAtZero: true,
                border: {
                    dash: [6, 4],
                },
                grid: {
                    color: '#548bcd',
                },
                ticks: {
                    stepSize: 10,
                    color: '#e7e7e7',
                    font: {
                        family: 'Roboto, sans-serif',
                        size: 12,
                        weight: 300
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
                annotations: {
                    rodeBalk: this.RodeBalk,
                    geleBalk: this.GeleBalk,
                    groeneBalk: this.GroeneBalk,
                    jaarGrens1: this.JaarGrens1,
                    jaarGrens2: this.JaarGrens2,
                }
            }
        }
    }

    lineChartPlugins = [AnnotationPlugin];
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
                private readonly sharedService: SharedService) {}

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
        if (this.JaarGrens1.type === "line") {
            this.JaarGrens1.value = 'Jan ' + (this.datum.year - 1).toString()
        }
        if (this.JaarGrens2.type === "line") {
            this.JaarGrens2.value = 'Jan ' + this.datum.year.toString()
        }

        this.popup.open();
    }

    async opvragen(): Promise<void> {
        const waardes = [];
        const lineChartLabels = [];

        this.bezig = true               // Indicator dat we aan het ophalen zijn, progress balk is dan zichtbaar
        let maxWaarde = 30;     // indien de vlieger een waarde heeft < 30, dan is 30 minimum, de groene, gele, rode balk zijn dan even hoog

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
            } catch (_) {
                waardes.push(0);
            }
        }
        if (this.GroeneBalk.type === "box") {       // aanpassen groene schaal
            this.GroeneBalk.yMax = Math.ceil(maxWaarde / 10) * 10;    // afronden naar boven in tientallen 70 - 80 - 90
        }

        this.lineChartData = {
            ...this.lineChartData,
            datasets: [
                {
                    ...this.lineChartData.datasets[0],
                    data: waardes,
                }
            ],
            labels: lineChartLabels,
        };
        this.bezig = false;                         // klaar met ophalen
    }
}
