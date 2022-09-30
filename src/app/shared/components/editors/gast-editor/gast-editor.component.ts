import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {ModalComponent} from "../../modal/modal.component";
import {HeliosAanwezigLedenDataset, HeliosGast} from "../../../../types/Helios";
import {GastenService} from "../../../../services/apiservice/gasten.service";

@Component({
    selector: 'app-gast-editor',
    templateUrl: './gast-editor.component.html',
    styleUrls: ['./gast-editor.component.scss']
})
export class GastEditorComponent implements OnInit {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() refresh: EventEmitter<void> = new EventEmitter<void>();

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    isLoading: boolean = false;
    isSaving: boolean = false;

    gast: HeliosGast;

    constructor(private readonly gastenService: GastenService) {
    }

    ngOnInit(): void {
    }
    // open popup, maar haal eerst de start op. De eerder ingevoerde tijd wordt als default waarde gebruikt
    // indien niet eerder ingvuld, dan de huidige tijd. Buiten de daglicht periode is het veld leeg
    openPopup(record: HeliosGast) {
        this.gast = record;

        // Ophalen uit de database, er kan iets veranderd zijn. Alleen als we bestaand record aanpassen
        if (record.ID) {
            this.isLoading = true
            this.gastenService.getGast(record.ID!).then((g) => {
                this.isLoading = false;
                this.gast = g;
            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        }

        this.popup.open();
    }

    verwijderen() {
        this.gastenService.deleteGast(this.gast!.ID!).then((a) => {
            this.success = {titel: "Aanmelden gast", beschrijving: "Aanmelding is verwijderd"}
            this.refresh.emit();

            this.isSaving = false;
            this.popup.close();
        }).catch(e => {
            this.error = e;
            this.isSaving = false;
        });
    }

    opslaan() {
        this.isSaving = true;

        // update of nieuwe aanmelding
        if (this.gast.ID) {
            this.gastenService.updateGast(this.gast).then(a => {
                this.success = {titel: "Aanmelden gast", beschrijving: "Aanmelding aangepast"}
                this.refresh.emit();

                this.gast = a;
                this.isSaving = false;
                this.popup.close();
            }).catch(e => {
                this.error = e;
                this.isSaving = false;
            })
        } else {
            this.gastenService.addGast(this.gast).then((a) => {
                this.success = {titel: "Aanmelden gast", beschrijving: "Aanmelding is geslaagd"}
                this.refresh.emit();

                this.isSaving = false;
                this.popup.close();
            }).catch(e => {
                this.error = e;
                this.isSaving = false;
            });
        }
    }
}
