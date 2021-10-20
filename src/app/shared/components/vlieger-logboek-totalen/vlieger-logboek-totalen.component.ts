import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {HeliosLogboekTotalen} from "../../../types/Helios";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {SharedService} from "../../../services/shared/shared.service";
import {ErrorMessage, SuccessMessage} from "../../../types/Utils";

@Component({
    selector: 'app-vlieger-logboek-totalen',
    templateUrl: './vlieger-logboek-totalen.component.html',
    styleUrls: ['./vlieger-logboek-totalen.component.scss']
})
export class VliegerLogboekTotalenComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;

    datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag
    data: HeliosLogboekTotalen;
    isLoading: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly startlijstService: StartlijstService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })

            this.data = {
                "totaal": 0,
                "laatste_aanpassing": "0000-00-00 00:00:00",
                "hash": "0",
                "starts": [],
                "vliegtuigen": [],
                "jaar": {"STARTS": 0, "INSTRUCTIE_STARTS": 0, "VLIEGTIJD": "0:00"}
            }
            this.opvragen();
        })

        // Als in de startlijst tabel is aangepast, moet we onze dataset ook aanpassen
        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Startlijst") {
                    this.opvragen();
                }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.opvragen()
        }
    }

    // opvragen van de totalen uit het vlieger logboek
    opvragen(): void {
        if (this.datum) {
            this.isLoading = true;
            this.startlijstService.getLogboekTotalen(this.VliegerID, this.datum.year).then((dataset) => {
                this.isLoading = false;
                this.data = dataset;
            }).catch(e => {
                this.error = e;
                this.isLoading = false;
            });
        }
    }

}
