import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { faFile, IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { HeliosDocument, HeliosDocumentenDataset, HeliosType } from '../../../types/Helios';
import { Subscription } from 'rxjs';
import { TypesService } from '../../../services/apiservice/types.service';
import { DocumentenService } from '../../../services/apiservice/documenten.service';
import {
  faCaretSquareDown,
  faCaretSquareUp,
  faMinusCircle,
  faPlusCircle,
  faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { DocumentEditorComponent } from '../../../shared/components/editors/document-editor/document-editor.component';
import { LoginService } from '../../../services/apiservice/login.service';

@Component({
    selector: 'app-documenten-scherm',
    templateUrl: './documenten-scherm.component.html',
    styleUrls: ['./documenten-scherm.component.scss']
})
export class DocumentenSchermComponent implements OnInit, OnDestroy {
    @ViewChild(DocumentEditorComponent) editor: DocumentEditorComponent;

    iconCardIcon: IconDefinition = faFile;
    toevoegenIcon: IconDefinition = faPlusCircle;
    deleteIcon:IconDefinition = faMinusCircle;
    restoreIcon:IconDefinition = faUndo;
    upIcon: IconDefinition = faCaretSquareUp;
    downIcon: IconDefinition = faCaretSquareDown;

    private typesAbonnement: Subscription;
    documentGroepen: HeliosType[] = [];
    documenten: HeliosDocumentenDataset[];

    editMode = false;          // zitten we in edit mode om documenten te kunnen aanpassen
    deleteMode = false;        // zitten we in delete mode om documenten te kunnen verwijderen
    trashMode = false;         // zitten in restore mode om documenten te kunnen terughalen

    magAanpassen = false;      // mag de gebruiker documenten aanpassen

    constructor(private readonly typesService: TypesService,
                private readonly loginService: LoginService,
                private readonly documentenService: DocumentenService) {
    }

    ngOnInit(): void {
        // abonneer op wijziging van documenten
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.documentGroepen = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 22;
            });
        });

        this.opvragen();

        // alleen beheerder mag documenten aanpassen
        const ui = this.loginService.userInfo?.Userinfo;
        this.magAanpassen = (ui?.isBeheerder) ?? false;
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
    }

    // ophalen document van de server
    opvragen() {
        this.documentenService.getDocumenten(this.trashMode).then((docs) => this.documenten = docs);
    }

    toonDocumenten(groep: number): HeliosDocumentenDataset[] {
        return (!this.documenten) ? [] :
            this.documenten.filter((d: HeliosDocumentenDataset) => {
                return d.GROEP_ID == groep
            });
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

    // mag document omlaag of omhoog geschoven worden in de lijst
    toonOmhoogOmlaag(groep: number) {
        const lijst = this.documenten.filter((d: HeliosDocumentenDataset) => {
            return d.GROEP_ID == groep
        });
        if ((!lijst) || (lijst.length <= 1)) {
            return false;
        }
        return true;
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

    toevoegen(id: number) {
        const doc: HeliosDocument = {
            GROEP_ID: id
        }

        this.editor.openPopup(doc);
    }


    omhoog(id: number) {
        const doc = this.documenten.find(d => d.ID == id);

        if (doc) {
            const lijst = this.documenten.filter((d: HeliosDocumentenDataset) => {
                return d.GROEP_ID == doc.GROEP_ID
            });

            if (lijst) {
                for (let i=0; i < lijst.length ; i++)  {
                    lijst[i].VOLGORDE = i;
                }

                const idx = lijst.findIndex(d => d.ID == id);
                if (idx > 0) {      // alleen iets doen als we nog omhoog kunnen
                    lijst[idx - 1].VOLGORDE = idx
                    lijst[idx].VOLGORDE = idx - 1;

                    // opslaan van alle records
                    let bezig = 0;
                    for (const item of lijst) {
                        bezig++;
                        this.documentenService.updateDocument(item).then(() => {
                            bezig--;

                            if (bezig == 0) {   // als alle save acties klaar zijn, dan opnieuw opvragen
                                this.opvragen()
                            }
                        })
                    }
                }
            }
        }
    }

    omlaag(id: number) {
        const doc = this.documenten.find(d => d.ID == id);

        if (doc) {
            const lijst = this.documenten.filter((d: HeliosDocumentenDataset) => {
                return d.GROEP_ID == doc.GROEP_ID
            });

            if (lijst) {
                for (let i = 0; i < lijst.length; i++) {
                    lijst[i].VOLGORDE = i;
                }

                const idx = lijst.findIndex(d => d.ID == id);
                if (idx < lijst.length-1) {      // alleen iets doen als we nog omhoog kunnen
                    lijst[idx + 1].VOLGORDE = idx
                    lijst[idx].VOLGORDE = idx + 1;

                    // opslaan van alle records
                    let bezig = 0;
                    for (const item of lijst) {
                        bezig++;
                        this.documentenService.updateDocument(item).then(() => {
                            bezig--;

                            if (bezig == 0) {   // als alle save acties klaar zijn, dan opnieuw opvragen
                                this.opvragen()
                            }
                        })
                    }
                }
            }
        }
    }

    openUrl(url: string | URL) {
        window.open(url);
    }
}
