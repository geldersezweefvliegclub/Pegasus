import {Component, ViewChild} from '@angular/core';
import {ModalComponent} from '../../modal/modal.component';
import {HeliosStart, HeliosStartDataset} from '../../../../types/Helios';
import {StartlijstService} from '../../../../services/apiservice/startlijst.service';

@Component({
    selector: 'app-tijd-invoer',
    templateUrl: './tijd-invoer.component.html',
    styleUrls: ['./tijd-invoer.component.scss']
})
export class TijdInvoerComponent {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    start: HeliosStart;

    isLoading: boolean = false;
    formTitel: string = "";
    label:string = "";
    context: string;
    overdag = [{tijd:"12:22", label: "12:22"}, {tijd:"12:23", label: "12:23"}, {tijd:"12:24", label: "12:24"}];
    tijd:any;



    constructor(private readonly startlijstService: StartlijstService,) {
    }

    openStarttijdPopup(record: HeliosStartDataset) {

        this.haalStartOp(record.ID as number);
        this.formTitel = 'Starttijd invoer';
        this.formTitel = 'Vlucht: #' + record.DAGNUMMER + ', ' + record.REG_CALL;
        this.label = 'Start';
        this.tijd = record.STARTTIJD;
        this.popup.open();
    }

    openLandingsTijdPopup(record: HeliosStartDataset) {
        this.haalStartOp(record.ID as number);
        this.formTitel = 'Landingstijd invoer';
        this.formTitel = 'Vlucht: #' + record.DAGNUMMER + ', ' + record.REG_CALL;
        this.label = 'Landing';
        this.tijd = record.LANDINGSTIJD;
        this.popup.open();
    }

    haalStartOp(id: number): void {
        this.isLoading = true;

        try {
            this.startlijstService.getStart(id).then((start) => {
                this.start = start;
                this.isLoading = false;
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    opslaan() {

    }

    numbersOnly() {

    }
}
