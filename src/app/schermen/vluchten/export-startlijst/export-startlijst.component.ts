import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';

@Component({
    selector: 'app-export-startlijst',
    templateUrl: './export-startlijst.component.html',
    styleUrls: ['./export-startlijst.component.scss'],
    imports: [ModalComponent, IconButtonComponent]
})
export class ExportStartlijstComponent {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() exportDataset: EventEmitter<string> = new EventEmitter<string>();

    exportKeuze = "dag"



    openPopup() {
        this.popup.open();
    }

    Exporteer() {
        this.exportDataset.emit(this.exportKeuze);
        this.popup.close();
    }
}
