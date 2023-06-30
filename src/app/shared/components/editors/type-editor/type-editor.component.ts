import {Component, Input, ViewChild} from '@angular/core';
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {ModalComponent} from "../../modal/modal.component";
import {HeliosType} from "../../../../types/Helios";
import {TypesService} from "../../../../services/apiservice/types.service";

@Component({
    selector: 'app-type-editor',
    templateUrl: './type-editor.component.html',
    styleUrls: ['./type-editor.component.scss']
})
export class TypeEditorComponent  {
    @Input() toonBedragEenheid: boolean = false;

    @ViewChild(ModalComponent) private popup: ModalComponent;
    formTitel: string;

    type: HeliosType = {};
    isLoading: boolean = false;
    isSaving: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly typesService: TypesService) {
    }

    // Open invoer popup voor de track. Als track ingevuld is, wijzigen we bestaande track
    openPopup(type: HeliosType) {
        this.type = type;   // vul alvast de editor met starts uit het grid
        if (type.ID) {
            this.formTitel = 'Bewerken';
            this.haalTypeOp(type.ID!);    // maar starts kan gewijzigd zijn, dus toch even starts ophalen van API
        } else {
            this.formTitel = "Toevoegen"
        }
        this.isSaving = false;
        this.isVerwijderMode = false;
        this.isRestoreMode = false;
        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }

    // ophalen van type uit de database (via API)
    haalTypeOp(id: number): void {
        this.isLoading = true;

        try {
            this.typesService.getType(id).then((t) => {
                this.type = t;
                this.isLoading = false;
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    // Toon popup om type te verwijderen
    openVerwijderPopup(id: number) {
        this.haalTypeOp(id);
        this.formTitel = 'Verwijderen';

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    // Toon popup om type uit de prullenbak te halen
    openRestorePopup(id: number) {
        this.haalTypeOp(id);
        this.formTitel = 'Herstellen';

        this.isSaving = false;
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    // uitvoeren van de actie waar we mee bezig zijn
    uitvoeren() {
        this.isSaving = true;
        if (this.isRestoreMode) {
            this.Herstellen(this.type);
        }

        if (this.isVerwijderMode) {
            this.Verwijderen(this.type);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.type.ID) {
                this.Aanpassen(this.type);
            } else {
                this.Toevoegen(this.type);
            }
        }
    }

    // opslaan in de database
    Toevoegen(type: HeliosType) {
        this.typesService.addType(type).then(() => {
            this.success = {
                titel: "Type",
                beschrijving: "Item is toegevoegd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // bestaande type is aangepast. Opslaan van het type
    Aanpassen(type: HeliosType) {
        let t:HeliosType;

        if (!this.type.READ_ONLY) {
            t = type;
        }
        else {
            t = {
                ID: type.ID,
                EXT_REF: type.EXT_REF,
                BEDRAG: type.BEDRAG,
                EENHEDEN: type.EENHEDEN,

            }
        }
        this.typesService.updateType(t).then(() => {
            this.success = {
                titel: "Type",
                beschrijving: "Item is gewijzigd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // markeer een type als verwijderd
    Verwijderen(type: HeliosType) {
        this.typesService.deleteType(type.ID!).then(() => {
            this.success = {
                titel: "Type",
                beschrijving: "Item is verwijderd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // het type herstellen, haal de markering 'verwijderd' weg
    Herstellen(type: HeliosType) {
        this.typesService.restoreType(type.ID!).then(() => {
            this.success = {
                titel: "Type",
                beschrijving: "Item is weer beschikbaar"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // Opslaan knop staat uit als we niet weten over wie het gaat, of er nog geen tekst is ingevoerd
    opslaanDisabled() {
        return !this.type.OMSCHRIJVING
    }
}
