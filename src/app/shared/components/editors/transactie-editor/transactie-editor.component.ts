import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../../modal/modal.component";
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {TransactiesService} from "../../../../services/apiservice/transacties.service";
import {HeliosLedenDataset, HeliosTransactie, HeliosType} from "../../../../types/Helios";
import {Subscription} from "rxjs";
import {LedenService} from "../../../../services/apiservice/leden.service";
import {TypesService} from "../../../../services/apiservice/types.service";

@Component({
    selector: 'app-transactie-editor',
    templateUrl: './transactie-editor.component.html',
    styleUrls: ['./transactie-editor.component.scss']
})
export class TransactieEditorComponent implements OnInit {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    @Input() toonLidSelectie: boolean = true;
    @Output() TransactieGedaan: EventEmitter<void> = new EventEmitter<void>();

    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];

    private typesAbonnement: Subscription;
    transactieTypes: HeliosType[];

    nieuweTransactie:HeliosTransactie = {}

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly ledenService: LedenService,
                private readonly typesService: TypesService,
                private readonly transactiesService: TransactiesService) {
    }

    ngOnInit(): void {
        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.leden = (leden) ? leden : [];
        });

        // abonneer op wijziging van transactie types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.transactieTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 20});
        });
    }

    openPopup(lidID: number | undefined) {
        if (lidID) {
            this.nieuweTransactie.LID_ID = lidID;
        }
        this.popup.open();
    }

    // opslaan van de transactie
    opslaan() {
        this.transactiesService.addTransactie(this.nieuweTransactie).then(() => this.TransactieGedaan.emit());
        this.popup.close();
    }

    // Over welke vlieger gaat deze track
    lidGeselecteerd(id: number | undefined) {
        this.nieuweTransactie.LID_ID = id;
    }

    typeAangepast() {
        const ttype = this.transactieTypes.find (t => t.ID == this.nieuweTransactie.TYPE_ID)

        if (ttype) {
            if ((!this.nieuweTransactie.EENHEDEN) && (ttype!.EENHEDEN)) {
                this.nieuweTransactie.EENHEDEN = ttype!.EENHEDEN;
            }
            if ((!this.nieuweTransactie.BEDRAG) && (ttype!.BEDRAG)) {
                this.nieuweTransactie.BEDRAG = ttype!.BEDRAG;
            }
        }
    }
}
