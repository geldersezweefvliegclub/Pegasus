import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal.component';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import { TransactiesService } from '../../../../services/apiservice/transacties.service';
import { HeliosLedenDataset, HeliosTransactie, HeliosType } from '../../../../types/Helios';
import { Subscription } from 'rxjs';
import { LedenService } from '../../../../services/apiservice/leden.service';
import { TypesService } from '../../../../services/apiservice/types.service';
import { NgbDate, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';
import { NgbDateFRParserFormatter } from '../../../ngb-date-fr-parser-formatter';

@Component({
    selector: 'app-transactie-editor',
    templateUrl: './transactie-editor.component.html',
    styleUrls: ['./transactie-editor.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class TransactieEditorComponent implements OnInit {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    @Input() toonLidSelectie = true;
    @Output() TransactieGedaan: EventEmitter<void> = new EventEmitter<void>();

    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];
    lidID: number;
    lidNaam: string;

    private typesAbonnement: Subscription;
    transactieTypes: HeliosType[];

    nieuweTransactie:HeliosTransactie = {}

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    vliegdag: DateTime | undefined;

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

    openPopup(lidID: number | undefined, vliegdag: string | undefined = undefined) {
        if (lidID) {
            this.lidID = lidID;
            this.nieuweTransactie.LID_ID = lidID;
        }

        if (vliegdag) {
            this.vliegdag = DateTime.fromSQL(vliegdag);
            this.nieuweTransactie.VLIEGDAG = this.vliegdag.toISODate() ?? undefined;
        }

        if (this.toonLidSelectie) {
            this.lidNaam =""
        }
        else {
            const Lid = this.leden.find((l) => l.ID == lidID)
            this.lidNaam = (Lid) ? Lid.NAAM! : "";
        }
        this.popup.open();
    }

    // opslaan van de transactie
    opslaan() {
        this.transactiesService.addTransactie(this.nieuweTransactie).then((t) => {
            let beschrijving =""
            if (t.BEDRAG) {
                const bijaf = (t.BEDRAG < 0) ? "af" : "bij";
                beschrijving =  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Math.abs(t.BEDRAG)) + " is succesvol " + bijaf + "geboekt"
            }
            if (t.EENHEDEN) {
                const bijaf = (t.EENHEDEN < 0) ? "af" : "bij";
                beschrijving = Math.abs(t.EENHEDEN) + " strippen is succesvol " + bijaf + "geboekt"
            }

            if (beschrijving === "") {
                beschrijving = "Geen mutatie, opmerking toegevoegd";
            }

            this.success = {
                titel: "Transactie",
                beschrijving: beschrijving
            }
            this.TransactieGedaan.emit()
        })
        .catch(e => {
            this.error = e;
        })
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

    // Datum van de start aanpassen
    vliegdagAanpassen($datum: NgbDate) {
        this.vliegdag = DateTime.fromObject({year: $datum.year, month: $datum.month, day: $datum.day});
        this.nieuweTransactie.VLIEGDAG = this.vliegdag.toISODate() ?? undefined;
    }

    leegMaken() {
        this.vliegdag = undefined;
        this.nieuweTransactie = {LID_ID: this.lidID}
    }
}
