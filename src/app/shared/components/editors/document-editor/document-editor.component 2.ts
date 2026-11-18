import { Component, inject, output, viewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal.component';
import { HeliosDocument } from '../../../../types/Helios';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import { DocumentenService } from '../../../../services/apiservice/documenten.service';
import { ErrorComponent } from '../../error/error.component';
import { SuccessComponent } from '../../success/success.component';
import { FormsModule } from '@angular/forms';
import { IconButtonComponent } from '../../icon-button/icon-button.component';
import { LoaderComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-document-editor',
    templateUrl: './document-editor.component.html',
    styleUrls: ['./document-editor.component.scss'],
    imports: [ErrorComponent, SuccessComponent, ModalComponent, FormsModule, IconButtonComponent, LoaderComponent]
})
export class DocumentEditorComponent {
    readonly refresh = output<void>();

    // variablen in html formulier
    protected formTitel: string;
    protected success: SuccessMessage | undefined;
    protected error: ErrorMessage | undefined;
    protected isLoading = false;
    protected isSaving = false;
    protected isVerwijderMode = false;
    protected isRestoreMode = false;
    protected isDoc = true;
    protected isUrl = false;
    protected document: HeliosDocument;

    // private variable voor ts script
    private readonly documentenService = inject(DocumentenService);
    private readonly popup = viewChild.required(ModalComponent);

    // open popup, maar haal eerst de start op. De eerder ingevoerde tijd wordt als default waarde gebruikt
    // indien niet eerder ingvuld, dan de huidige tijd. Buiten de daglicht periode is het veld leeg
    openPopup(record: HeliosDocument) {
        this.isSaving = false;
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
        this.popup().open();
    }

    private closePopup() {
        this.popup().close();
    }

    // Toon popup om type te verwijderen
    openVerwijderPopup(record: HeliosDocument) {
        this.docUrl("url");
        this.document = record;
        this.formTitel = 'Verwijderen';

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup().open();
    }

    // Toon popup om type uit de archief te halen
    openRestorePopup(record: HeliosDocument) {
        this.docUrl("url");
        this.document = record;
        this.formTitel = 'Herstellen';

        this.isSaving = false;
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup().open();
    }

    // uitvoeren van de actie waar we mee bezig zijn
    protected uitvoeren() {
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

    private verwijderen() {
        this.documentenService.deleteDocument(this.document!.ID!).then(() => {
            this.success = {titel: "Document", beschrijving: "Verwijderen is geslaagd"}
            this.refresh.emit();

            this.isSaving = false;
            this.popup().close();
        }).catch(e => {
            this.error = e;
            this.isSaving = false;
        });
    }

    // het type herstellen, haal de markering 'verwijderd' weg
    private herstellen() {
        this.documentenService.restoreDocument(this.document.ID!).then(() => {
            this.isSaving = false;
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

    private aanpassen() {
        this.isSaving = true;

        this.documentenService.updateDocument(this.document).then(doc => {
            this.success = {titel: "Document", beschrijving: this.document.TEKST + " is aangepast"}
            this.refresh.emit();

            this.document = doc;
            this.isSaving = false;
            this.popup().close();
        }).catch(e => {
            this.error = e;
            this.isSaving = false;
        })
    }

    private toevoegen() {
        this.isSaving = true;

        this.documentenService.addDocument(this.document).then(() => {
            this.success = {titel: "Document", beschrijving: this.document.TEKST + " is toegevoegd"}
            this.refresh.emit();

            this.isSaving = false;
            this.popup().close();
        }).catch(e => {
            this.error = e;
            this.isSaving = false;
        });
    }

    protected BijlageChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files as FileList;

        const reader = new FileReader();
        reader.readAsDataURL(files[0]);
        reader.onload = () => {
            this.document.BASE64_DOC = reader.result?.toString().split(",")[1];
            this.document.DOC_NAAM = files[0].name;
        };

    }

    protected docUrl(p: string) {
        this.isDoc = (p == "doc");
        this.isUrl = (p == "url");
    }
}
