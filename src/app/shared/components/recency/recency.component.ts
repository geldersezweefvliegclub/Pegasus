import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {HeliosRecency} from "../../../types/Helios";
import {ModalComponent} from "../modal/modal.component";
import {RecencyGrafiekComponent} from "./recency-grafiek/recency-grafiek.component";

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

    constructor(private readonly startlijstService: StartlijstService) {
    }

    ngOnInit(): void {
        this.ophalen();
    }

    ophalen(): void {
        this.startlijstService.getRecency(this.VliegerID).then((r) => this.recency = r);
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
