import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../../modal/modal.component";
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {TransactiesService} from "../../../../services/apiservice/transacties.service";
import {HeliosTransactie} from "../../../../types/Helios";

@Component({
    selector: 'app-transactie-editor',
    templateUrl: './transactie-editor.component.html',
    styleUrls: ['./transactie-editor.component.scss']
})
export class TransactieEditorComponent implements OnInit {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() TransactieGedaan: EventEmitter<void> = new EventEmitter<void>();

    lidID: number;

    OMSCHRIJVING: string;
    BEDRAG: number;
    EENHEDEN: number;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly transactiesService: TransactiesService) {
    }

    ngOnInit(): void {
    }

    openPopup(lidID: number) {
        this.lidID = lidID;
        this.popup.open();
    }

    // opslaan van de transactie
    opslaan() {
        const t: HeliosTransactie = {
            LID_ID: this.lidID,
            EENHEDEN: this.EENHEDEN,
            BEDRAG: this.BEDRAG,
            OMSCHRIJVING: this.OMSCHRIJVING
        }
        this.transactiesService.addTransactie(t).then(() => this.TransactieGedaan.emit());
        this.popup.close();
    }
}
