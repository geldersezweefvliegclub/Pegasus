import {Component, OnInit, ViewChild} from '@angular/core';
import {HeliosVliegtuig, HeliosVliegtuigLogboekDataset,} from '../../../types/Helios';
import {StartlijstService} from '../../../services/apiservice/startlijst.service';
import {Subscription} from 'rxjs';
import {DateTime} from 'luxon';
import {SharedService} from '../../../services/shared/shared.service';
import {VliegtuigenService} from '../../../services/apiservice/vliegtuigen.service';
import {ModalComponent} from '../../../shared/components/modal/modal.component';
import {ErrorMessage} from '../../../types/Utils';


@Component({
    selector: 'app-vliegtuig-logboek',
    templateUrl: './vliegtuig-logboek.component.html',
    styleUrls: ['./vliegtuig-logboek.component.scss']
})
export class VliegtuigLogboekComponent implements OnInit {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    data: HeliosVliegtuigLogboekDataset[] = [];
    vliegtuig: HeliosVliegtuig = {};
    private vliegtuigID:  number;
    isLoading: boolean = false;

    private datumAbonnement: Subscription; // volg de keuze van de kalender
    datum: DateTime = DateTime.now();      // de gekozen dag
    error: ErrorMessage | undefined;

    constructor(private readonly startlijstService: StartlijstService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })
        })
    }

    showPopup(ID: number) {
        this.vliegtuigID = ID;
        this.opvragen();
        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }


    // Opvragen van de starts via de api
    opvragen() {
        this.isLoading = true;

        const startDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
        const eindDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});

        this.vliegtuigenService.getVliegtuig(this.vliegtuigID).then((vliegtuig) => this.vliegtuig = vliegtuig);
        this.startlijstService.getVliegtuigLogboek(this.vliegtuigID, startDatum, eindDatum, 5).then((dataset) => {
            dataset.forEach((dag) => dag.DATUM = this.sharedService.datumDMJ(dag.DATUM!))
            this.data = dataset;
            this.isLoading = false;
        }).catch(e => {
            this.error = e;
        });
    }
}


