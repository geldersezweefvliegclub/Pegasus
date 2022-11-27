import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../../modal/modal.component";
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {TransactiesService} from "../../../../services/apiservice/transacties.service";
import {HeliosLedenDataset, HeliosTransactie} from "../../../../types/Helios";
import {Subscription} from "rxjs";
import {LedenService} from "../../../../services/apiservice/leden.service";

@Component({
    selector: 'app-transactie-editor',
    templateUrl: './transactie-editor.component.html',
    styleUrls: ['./transactie-editor.component.scss']
})
export class TransactieEditorComponent implements OnInit {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() TransactieGedaan: EventEmitter<void> = new EventEmitter<void>();

    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];

    toonLidSelectie: boolean = false;
    lidID: number | undefined;

    OMSCHRIJVING: string;
    BEDRAG: number;
    EENHEDEN: number;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly ledenService: LedenService,
                private readonly transactiesService: TransactiesService) {
    }

    ngOnInit(): void {
        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.leden = (leden) ? leden : [];
        });
    }

    openPopup(lidID: number | undefined) {
        if (lidID) {
            this.toonLidSelectie = false;
            this.lidID = lidID;
        }
        else {
            this.toonLidSelectie = true;
        }
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

    // Over welke vlieger gaat deze track
    lidGeselecteerd(id: number | undefined) {
        this.lidID = id;
    }
}
