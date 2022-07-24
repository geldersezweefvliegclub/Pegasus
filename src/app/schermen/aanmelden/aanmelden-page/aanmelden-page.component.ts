import {Component, OnDestroy, OnInit} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faStreetView} from "@fortawesome/free-solid-svg-icons";
import {Subscription} from "rxjs";
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {getBeginEindDatumVanMaand} from "../../../utils/Utils";
import {DateTime} from "luxon";
import {HeliosRoosterDataset} from "../../../types/Helios";
import {RoosterService} from "../../../services/apiservice/rooster.service";

@Component({
    selector: 'app-aanmelden-page',
    templateUrl: './aanmelden-page.component.html',
    styleUrls: ['./aanmelden-page.component.scss']
})
export class AanmeldenPageComponent implements OnInit, OnDestroy {

    readonly aanmeldenIcon: IconDefinition = faStreetView;

    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    datum: DateTime = DateTime.now();               // de gekozen dag
    maandag: DateTime                               // de eerste dag van de week

    isLoading: boolean = false;
    aanmeldenView: string = "week";
    rooster: HeliosRoosterDataset[];                // rooster voor gekozen periode (dag/week/maand)

    constructor(private readonly sharedService: SharedService,
                private readonly roosterService: RoosterService) {
    }

    ngOnInit(): void {

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1
                })
                this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
                this.opvragen();
            }
        })

        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            const opvragenTotalen = datum.month != this.datum.month;

            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day,
            })
            this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
            this.opvragen();
        });

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize();
            this.opvragen();
        });
    }

    ngOnDestroy(): void {
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    onWindowResize() {
        if (this.sharedService.getSchermSize() <= SchermGrootte.sm) {
            this.aanmeldenView = "dag"
        } else {
            this.aanmeldenView = "week"
        }
    }

    private opvragen(): void {
        const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

        let beginDatum: DateTime = beginEindDatum.begindatum;
        let eindDatum: DateTime = beginEindDatum.einddatum;

        switch (this.aanmeldenView) {
            case "dag" : {
                beginDatum = this.datum;
                eindDatum = this.datum;
                break;
            }
            case "week": {
                beginDatum = this.datum.startOf('week');     // maandag in de 1e week vande maand, kan in de vorige maand vallen
                eindDatum = this.datum.endOf('week');        // zondag van de laaste week, kan in de volgende maand vallen
                break;
            }
        }
        this.isLoading = true;
        this.roosterService.getRooster(beginDatum, eindDatum).then((rooster) => {
            this.rooster = rooster;
            this.isLoading = false;
        }).catch(() => this.isLoading = false)
    }

    zetDatum(nieuweDatum: DateTime) {
        this.datum = nieuweDatum;
        this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
        this.opvragen();
    }
}
