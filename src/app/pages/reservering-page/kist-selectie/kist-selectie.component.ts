import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {HeliosVliegtuigenDataset} from "../../../types/Helios";
import {HeliosVliegtuigenDatasetExtended} from "../reservering-page.component";


@Component({
    selector: 'app-kist-selectie',
    templateUrl: './kist-selectie.component.html',
    styleUrls: ['./kist-selectie.component.scss']
})
export class KistSelectieComponent  {
    @Input() clubVliegtuigen: HeliosVliegtuigenDatasetExtended[];
    @Output() aangepast: EventEmitter<number> = new EventEmitter<number>();

    @ViewChild(ModalComponent) private popup: ModalComponent;

    openPopup() {
        this.popup.open();
    }

    changeTonen(id: number) {
        this.aangepast.emit(id);
    }
}
