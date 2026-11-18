import { Component, inject, OnInit, input, viewChild } from '@angular/core';
import { faMinusCircle, faPlusCircle, faUndo, } from '@fortawesome/free-solid-svg-icons';
import {
    DocumentEditorComponent,
} from '../../../../shared/components/editors/document-editor/document-editor.component';
import { faFile, IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { HeliosDocument, HeliosDocumentenDataset } from '../../../../types/Helios';
import { DocumentenService } from '../../../../services/apiservice/documenten.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { PegasusCardComponent } from '../../../../shared/components/pegasus-card/pegasus-card.component';
import { StatusButtonComponent } from '../../../../shared/components/status-button/status-button.component';

@Component({
    selector: 'app-leden-documenten',
    templateUrl: './leden-documenten.component.html',
    styleUrls: ['./leden-documenten.component.scss'],
    imports: [DocumentEditorComponent, IconButtonComponent, PegasusCardComponent, StatusButtonComponent, FaIconComponent]
})
export class LedenDocumentenComponent implements OnInit {
    readonly LidID = input.required<number>();

    // variablen in html formulier
    protected readonly editor = viewChild.required(DocumentEditorComponent);

    protected iconCardIcon: IconDefinition = faFile;
    protected toevoegenIcon: IconDefinition = faPlusCircle;
    protected deleteIcon: IconDefinition = faMinusCircle;
    protected restoreIcon: IconDefinition = faUndo;
    protected documenten: HeliosDocumentenDataset[];
    protected editMode = false;          // zitten we in edit mode om documenten te kunnen aanpassen
    protected deleteMode = false;        // zitten we in delete mode om documenten te kunnen verwijderen
    protected trashMode = false;

    // private variable voor ts script
    private readonly documentenService = inject(DocumentenService);

    ngOnInit(): void {
        this.opvragen();
    }

    // ophalen document van de server
    protected opvragen() {
        this.documentenService.getDocumenten(this.trashMode, this.LidID()).then((docs) => this.documenten = docs);
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde documenten getoond
    protected trashModeJaNee(actief: boolean) {
        this.trashMode = actief

        this.opvragen();
    }

    protected deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
    }

    protected delete(id: number) {
        const doc = this.documenten.find(d => d.ID == id);

        if (doc) {
            this.editor().openVerwijderPopup(doc);
        }
    }

    protected restore(id: number) {
        const doc = this.documenten.find(d => d.ID == id);

        if (doc) {
            this.editor().openRestorePopup(doc);
        }
    }

    protected aanpassen(id: number) {
        const doc = this.documenten.find(d => d.ID == id);

        if (doc) {
            this.editor().openPopup(doc);
        }
    }

    protected toevoegen() {
        const doc: HeliosDocument = {
            LID_ID: this.LidID(),
            GROEP_ID: 22                      // Speciaal type
        }

        this.editor().openPopup(doc);
    }

    protected openUrl(url: string | URL) {
        window.open(url);
    }
}
