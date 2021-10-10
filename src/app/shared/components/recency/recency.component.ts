import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {HeliosRecency} from "../../../types/Helios";
import {RecencyGrafiekComponent} from "./recency-grafiek/recency-grafiek.component";
import {ErrorMessage, SuccessMessage} from "../../../types/Utils";

@Component({
    selector: 'app-recency',
    templateUrl: './recency.component.html',
    styleUrls: ['./recency.component.scss']
})
export class RecencyComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;
    @Input() naam: string;

    @ViewChild(RecencyGrafiekComponent) private grafiek: RecencyGrafiekComponent;

    recency: HeliosRecency;
    isLoading: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly startlijstService: StartlijstService) {
    }

    ngOnInit(): void {
        this.ophalen();
    }

    ophalen(): void {
        this.isLoading = true;
        this.startlijstService.getRecency(this.VliegerID).then((r) => {
            this.isLoading = false;
            this.recency = r
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.ophalen()
        }
    }

    openRecencyPopup(): void {
        this.grafiek.openPopup();
    }
}
