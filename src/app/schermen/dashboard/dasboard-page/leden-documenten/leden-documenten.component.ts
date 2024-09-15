import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  faCaretSquareDown,
  faCaretSquareUp,
  faMinusCircle,
  faPlusCircle,
  faUndo,
} from '@fortawesome/free-solid-svg-icons';
import {
  DocumentEditorComponent,
} from '../../../../shared/components/editors/document-editor/document-editor.component';
import { faFile, IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { HeliosDocument, HeliosDocumentenDataset } from '../../../../types/Helios';
import { TypesService } from '../../../../services/apiservice/types.service';
import { DocumentenService } from '../../../../services/apiservice/documenten.service';

@Component({
    selector: 'app-leden-documenten',
    templateUrl: './leden-documenten.component.html',
    styleUrls: ['./leden-documenten.component.scss']
})
export class LedenDocumentenComponent implements OnInit {
    @Input() LidID: number;
    @ViewChild(DocumentEditorComponent) editor: DocumentEditorComponent;

    iconCardIcon: IconDefinition = faFile;
    toevoegenIcon: IconDefinition = faPlusCircle;
    deleteIcon: IconDefinition = faMinusCircle;
    restoreIcon: IconDefinition = faUndo;
    upIcon: IconDefinition = faCaretSquareUp;
    downIcon: IconDefinition = faCaretSquareDown;

    documenten: HeliosDocumentenDataset[];

    editMode = false;          // zitten we in edit mode om documenten te kunnen aanpassen
    deleteMode = false;        // zitten we in delete mode om documenten te kunnen verwijderen
    trashMode = false;         // zitten in restore mode om documenten te kunnen terughalen

    constructor(private readonly typesService: TypesService,
                private readonly documentenService: DocumentenService) {
    }

    ngOnInit(): void {
        this.opvragen();
    }

    // ophalen document van de server
    opvragen() {
        this.documentenService.getDocumenten(this.trashMode, this.LidID).then((docs) => this.documenten = docs);
    }


    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde documenten getoond
    trashModeJaNee(actief: boolean) {
        this.trashMode = actief

        this.opvragen();
    }

    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
    }

    delete(id: number) {
        const doc = this.documenten.find(d => d.ID == id);

        if (doc) {
            this.editor.openVerwijderPopup(doc);
        }
    }

    restore(id: number) {
        const doc = this.documenten.find(d => d.ID == id);

        if (doc) {
            this.editor.openRestorePopup(doc);
        }
    }

    aanpassen(id: number) {
        const doc = this.documenten.find(d => d.ID == id);

        if (doc) {
            this.editor.openPopup(doc);
        }
    }

    toevoegen() {
        const doc: HeliosDocument = {
            LID_ID: this.LidID,
            GROEP_ID: 22                      // Speciaal type
        }

        this.editor.openPopup(doc);
    }

    openUrl(url: string | URL) {
        window.open(url);
    }
}

