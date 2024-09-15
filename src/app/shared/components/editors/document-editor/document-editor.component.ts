import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal.component';
import { HeliosDocument } from '../../../../types/Helios';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import { DocumentenService } from '../../../../services/apiservice/documenten.service';

@Component({
    selector: 'app-document-editor',
    templateUrl: './document-editor.component.html',
    styleUrls: ['./document-editor.component.scss']
})
export class DocumentEditorComponent {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() refresh: EventEmitter<void> = new EventEmitter<void>();
    formTitel: string;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    isLoading = false;
    isSaving = false;

    isVerwijderMode = false;
    isRestoreMode = false;

    isDoc = true;
    isUrl = false;

    document: HeliosDocument;

    constructor(private readonly documentenService: DocumentenService) {
    }

    // open popup, maar haal eerst de start op. De eerder ingevoerde tijd wordt als default waarde gebruikt
    // indien niet eerder ingvuld, dan de huidige tijd. Buiten de daglicht periode is het veld leeg
    openPopup(record: HeliosDocument) {
        this.docUrl("url");
        this.document = record;
        this.isVerwijderMode = false;
        this.isRestoreMode = false;

        this.document.BASE64_DOC = undefined;
        this.document.DOC_NAAM = undefined;
        this.document.OVERSCHRIJVEN = false;

        if (this.document.ID) {
            this.formTitel = 'Aanpassen';
        }
        else {
            this.docUrl("doc");
            this.formTitel = 'Toevoegen';
        }
        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }

    // Toon popup om type te verwijderen
    openVerwijderPopup(record: HeliosDocument) {
        this.docUrl("url");
        this.document = record;
        this.formTitel = 'Verwijderen';

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    // Toon popup om type uit de archief te halen
    openRestorePopup(record: HeliosDocument) {
        this.docUrl("url");
        this.document = record;
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
            this.herstellen();
        }

        if (this.isVerwijderMode) {
            this.verwijderen();
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.isDoc && this.document.DOC_NAAM !== undefined) {
                this.document.URL = undefined;
            }

            if (this.isUrl) {
                this.document.BASE64_DOC = undefined;
                this.document.DOC_NAAM = undefined;
            }

            if (this.document.ID) {
                this.aanpassen();
            } else {
                this.toevoegen();
            }
        }
    }

    verwijderen() {
        this.documentenService.deleteDocument(this.document!.ID!).then((a) => {
            this.success = {titel: "Document", beschrijving: "Verwijderen is geslaagd"}
            this.refresh.emit();

            this.isSaving = false;
            this.popup.close();
        }).catch(e => {
            this.error = e;
            this.isSaving = false;
        });
    }

    // het type herstellen, haal de markering 'verwijderd' weg
    herstellen() {
        this.documentenService.restoreDocument(this.document.ID!).then(() => {
            this.success = {
                titel: "Document",
                beschrijving: "Document is weer beschikbaar"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    aanpassen() {
        this.isSaving = true;

        this.documentenService.updateDocument(this.document).then(doc => {
            this.success = {titel: "Document", beschrijving: this.document.TEKST + " is aangepast"}
            this.refresh.emit();

            this.document = doc;
            this.isSaving = false;
            this.popup.close();
        }).catch(e => {
            this.error = e;
            this.isSaving = false;
        })
    }

    toevoegen() {
        this.isSaving = true;

        this.documentenService.addDocument(this.document).then((a) => {
            this.success = {titel: "Document", beschrijving: this.document.TEKST + " is toegevoegd"}
            this.refresh.emit();

            this.isSaving = false;
            this.popup.close();
        }).catch(e => {
            this.error = e;
            this.isSaving = false;
        });
    }

    BijlageChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files as FileList;

        const reader = new FileReader();
        reader.readAsDataURL(files[0]);
        reader.onload = () => {
            this.document.BASE64_DOC = reader.result?.toString().split(",")[1];
            this.document.DOC_NAAM = files[0].name;
        };

    }

    docUrl(p: string) {
        this.isDoc = (p == "doc");
        this.isUrl = (p == "url");
    }
}
