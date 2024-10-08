import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal.component';
import { Subscription } from 'rxjs';
import { DateTime } from 'luxon';
import * as pluginAnnotations from 'chartjs-plugin-annotation';
import { AnnotationOptions } from 'chartjs-plugin-annotation';
import { ChartDataset, ChartOptions } from 'chart.js';
import { StartlijstService } from '../../../../services/apiservice/startlijst.service';
import { SharedService } from '../../../../services/shared/shared.service';

@Component({
    selector: 'app-instructie-grafiek',
    templateUrl: './instructie-grafiek.component.html',
    styleUrls: ['./instructie-grafiek.component.scss']
})
export class InstructieGrafiekComponent implements OnInit {
    @Input() VliegerID: number;
    @Input() naam: string;

    @ViewChild(ModalComponent) private popup: ModalComponent;

    private datumAbonnement: Subscription;  // volg de keuze van de kalender
    datum: DateTime = DateTime.now();       // de gekozen dag

    starts: number[] = [];
    uren: number[] = [];
    bezig = false;
    counter = 0;

    // Teken een verticale lijn op de 1e jaargrens zodat je de jaren goed kunt onderscheiden
    JaarGrens1: AnnotationOptions =
        {
            type: 'line',
            scaleID: 'x-axis-0',
            value: '',                       // wordt later gezet
            borderColor: '#9b9b9b',
            borderWidth: 1,
        }

    // Teken een verticale lijn op de 2e jaargrens zodat je de jaren goed kunt onderscheiden
    JaarGrens2: AnnotationOptions =
        {
            type: 'line',
            scaleID: 'x-axis-0',
            value: '',                      // wordt later gezet
            borderColor: '#9b9b9b',
            borderWidth: 1,
        }

    // Teken een verticale lijn op de 3e jaargrens zodat je de jaren goed kunt onderscheiden
    JaarGrens3: AnnotationOptions =
        {
            type: 'line',
            scaleID: 'x-axis-0',
            value: '',                      // wordt later gezet
            borderColor: '#9b9b9b',
            borderWidth: 1,
        }

    MinimaleEisUren: AnnotationOptions =
        {
            type: 'line',
            scaleID: 'y-axis-0',
            value: '30',
            borderColor: '#2f4a7f',
            borderWidth: 2,
            borderDash: [10,5]
        }

    MinimaleEisStarts: AnnotationOptions =
        {
            type: 'line',
            scaleID: 'y-axis-0',
            value: '60',
            borderColor: '#d6b052',
            borderWidth: 2,
            borderDash: [10,5]
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
        elements : {
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
                        family:  'Roboto, sans-serif',
                        size: 12,
                        weight: 300
                    }
                }
            },
            "y-axis-0": {
                border: {
                    dash: [6, 4]
                },
                grid: {
                    color: '#9b9b9b',
                },
                ticks: {
                    stepSize: 10,
                    color: '#9b9b9b',
                    font: {
                        family: 'Roboto, sans-serif',
                        size: 12,
                        weight: 300
                    },
                },
                beginAtZero: true
            }
        },
        plugins: {
            annotation: {
                annotations: [
                    this.MinimaleEisStarts,
                    this.MinimaleEisUren,
                    this.JaarGrens1,
                    this.JaarGrens2,
                    this.JaarGrens3,
                ]
            }
        }
    }

    lineChartLabels: string[] = []
    lineChartLegend = true;

    lineChartPlugins = [pluginAnnotations];
    lineChartData: ChartDataset[] = [];

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
            this.JaarGrens1.xMin = 'Jan ' + (this.datum.year-2).toString()
            this.JaarGrens1.xMax = 'Jan ' + (this.datum.year-2).toString()
        }

        if (this.JaarGrens2.type === "line") {
            this.JaarGrens2.xMin = 'Jan ' + (this.datum.year-1).toString()
            this.JaarGrens2.xMax = 'Jan ' + (this.datum.year-1).toString()
        }

        if (this.JaarGrens3.type === "line") {
            this.JaarGrens3.xMin = 'Jan ' + this.datum.year.toString()
            this.JaarGrens3.xMax = 'Jan ' + this.datum.year.toString()
        }
        this.popup.open();
    }

    async opvragen(): Promise<void> {
        const starts = [];
        const uren = [];
        const lineChartLabels = [];

        this.bezig = true               // Indicator dat we aan het ophalen zijn, progress balk is dan zichtbaar
        let maxWaarde = 70;

        for (this.counter = 0; this.counter < 36; this.counter++) {
            const d = this.datum.plus({months: -1 * (36 - this.counter - 1)});

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
                starts.push(recency.STARTS_INSTRUCTIE as number);

                const vliegtijdParts = recency.UREN_INSTRUCTIE?.split(':');
                const hours =  +vliegtijdParts![0];
                const minutes = +vliegtijdParts![1];
                uren.push(hours + minutes /60);


                // de maximale waarde die de grafiek heeft
                if (recency.STARTS_INSTRUCTIE as number > maxWaarde) {
                    maxWaarde = recency.STARTS_INSTRUCTIE as number;
                }

                // de maximale waarde die de grafiek heeft
                if (hours+1 > maxWaarde) {
                    maxWaarde = hours+1;
                }
            } catch (_) {
                starts.push(0);
                uren.push(0);
            }
        }
        this.bezig = false;                         // klaar met ophalen

        this.uren = uren;
        this.starts = starts;

        this.lineChartLabels = lineChartLabels;

        const startsReeks: ChartDataset = {
            label: "Starts",
            fill: true,
            backgroundColor: 'rgb(214,176,82, 0.4)',
            borderColor: 'rgba(213,172,73,0.59)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)',

            data: this.starts,
        }

        const urenReeks: ChartDataset = {
            label: "Uren",
            fill: true,
            backgroundColor: 'rgba(119,151,218,0.4)',
            borderColor: 'rgba(2,49,150,0.59)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)',

            data: this.uren,
        }
        this.lineChartData = [startsReeks, urenReeks];
    }
}
