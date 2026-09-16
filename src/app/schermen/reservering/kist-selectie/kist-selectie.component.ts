import { Component, ViewChild, input, output } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { HeliosVliegtuigenDatasetExtended } from '../reservering-page/reservering-page.component';


@Component({
    selector: 'app-kist-selectie',
    templateUrl: './kist-selectie.component.html',
    styleUrls: ['./kist-selectie.component.scss'],
    imports: [ModalComponent]
})
export class KistSelectieComponent  {
    readonly clubVliegtuigen = input<HeliosVliegtuigenDatasetExtended[]>([]);
    readonly aangepast = output<number>();

    @ViewChild(ModalComponent) private popup: ModalComponent;

    openPopup() {
        this.popup.open();
    }

    changeTonen(id: number) {
        this.aangepast.emit(id);
    }
}
