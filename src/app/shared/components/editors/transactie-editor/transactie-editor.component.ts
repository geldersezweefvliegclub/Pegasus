import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal.component';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import { TransactiesService } from '../../../../services/apiservice/transacties.service';
import { HeliosLedenDataset, HeliosTransactie, HeliosType } from '../../../../types/Helios';
import { Subscription } from 'rxjs';
import { LedenService } from '../../../../services/apiservice/leden.service';
import { TypesService } from '../../../../services/apiservice/types.service';
import { NgbDate, NgbDateParserFormatter, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';
import { NgbDateFRParserFormatter } from '../../../ngb-date-fr-parser-formatter';
import { ErrorComponent } from '../../error/error.component';
import { SuccessComponent } from '../../success/success.component';
import { LidInvoerComponent } from '../start-editor/lid-invoer/lid-invoer.component';
import { FormsModule } from '@angular/forms';
import { IconButtonComponent } from '../../icon-button/icon-button.component';

@Component({
    selector: 'app-transactie-editor',
    templateUrl: './transactie-editor.component.html',
    styleUrls: ['./transactie-editor.component.scss'],
    providers: [{ provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter }],
    imports: [ErrorComponent, SuccessComponent, ModalComponent, LidInvoerComponent, FormsModule, NgbInputDatepicker, IconButtonComponent]
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

    transactie:HeliosTransactie = {}

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

    openPopup(lidID: number | undefined, vliegdag: string | undefined = undefined, ID: number | undefined = undefined) {
        if (ID) {
            this.transactiesService.getTransactie(ID).then((t) => {
                this.transactie = t;
                this.vliegdag = DateTime.fromSQL(t.VLIEGDAG!);
            })
        }
        else
        {
            if (lidID)
            {
                this.lidID = lidID;
                this.transactie.LID_ID = lidID;
            }

            if (vliegdag)
            {
                this.vliegdag = DateTime.fromSQL(vliegdag);
                this.transactie.VLIEGDAG = this.vliegdag.toISODate() ?? undefined;
            }

            if (this.toonLidSelectie)
            {
                this.lidNaam = ""
            }
            else
            {
                const Lid = this.leden.find((l) => l.ID == lidID)
                this.lidNaam = (Lid) ? Lid.NAAM! : "";
            }
        }
        this.popup.open();
    }

    // opslaan van de transactie
    opslaan() {
        if (this.transactie.ID)
        {
            this.transactiesService.updateTransactie(this.transactie).then(() => {
                this.success = {
                    titel: "Transactie",
                    beschrijving: "Transactie is succesvol aangepast"
                }
                this.TransactieGedaan.emit()
            })
           .catch(e =>
           {
               this.error = e;
           })
        }
        else
        {
            this.transactiesService.addTransactie(this.transactie).then((t) =>
            {
                let beschrijving = ""
                if (t.BEDRAG)
                {
                    const bijaf = (t.BEDRAG < 0) ? "af" : "bij";
                    beschrijving = new Intl.NumberFormat('nl-NL', {
                        style: 'currency',
                        currency: 'EUR'
                    }).format(Math.abs(t.BEDRAG)) + " is succesvol " + bijaf + "geboekt"
                }
                if (t.EENHEDEN)
                {
                    const bijaf = (t.EENHEDEN < 0) ? "af" : "bij";
                    beschrijving = Math.abs(t.EENHEDEN) + " strippen is succesvol " + bijaf + "geboekt"
                }

                if (beschrijving === "")
                {
                    beschrijving = "Geen mutatie, opmerking toegevoegd";
                }

                this.success = {
                    titel: "Transactie",
                    beschrijving: beschrijving
                }
                this.TransactieGedaan.emit()
            })
           .catch(e =>
           {
               this.error = e;
           })
        }
        this.popup.close();
    }

    // Over welke vlieger gaat deze track
    lidGeselecteerd(id: number | undefined) {
        this.transactie.LID_ID = id;
    }

    typeAangepast() {
        const ttype = this.transactieTypes.find (t => t.ID == this.transactie.TYPE_ID)

        if (ttype) {
            if ((!this.transactie.EENHEDEN) && (ttype!.EENHEDEN)) {
                this.transactie.EENHEDEN = ttype!.EENHEDEN;
            }
            if ((!this.transactie.BEDRAG) && (ttype!.BEDRAG)) {
                this.transactie.BEDRAG = ttype!.BEDRAG;
            }
        }
    }

    // Datum van de start aanpassen
    vliegdagAanpassen($datum: NgbDate) {
        this.vliegdag = DateTime.fromObject({year: $datum.year, month: $datum.month, day: $datum.day});
        this.transactie.VLIEGDAG = this.vliegdag.toISODate() ?? undefined;
    }

    leegMaken() {
        this.vliegdag = undefined;
        this.transactie = {LID_ID: this.lidID}
    }
}
