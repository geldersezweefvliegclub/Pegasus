import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../../../shared/components/modal/modal.component";

@Component({
    selector: 'app-export-startlijst',
    templateUrl: './export-startlijst.component.html',
    styleUrls: ['./export-startlijst.component.scss']
})
export class ExportStartlijstComponent {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() exportDataset: EventEmitter<string> = new EventEmitter<string>();

    exportKeuze = "dag"

    constructor() {
    }

    openPopup() {
        this.popup.open();
    }

    Exporteer() {
        this.exportDataset.emit(this.exportKeuze);
        this.popup.close();
    }
}
