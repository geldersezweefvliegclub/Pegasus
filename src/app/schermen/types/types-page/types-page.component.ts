import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import {
    faCaretSquareDown,
    faCaretSquareUp,
    faKeyboard,
    faMinusCircle,
    faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { TypesGroepenService } from '../../../services/apiservice/types-groepen.service';
import { HeliosType, HeliosTypesGroep } from '../../../types/Helios';
import { TypesService } from '../../../services/apiservice/types.service';
import { TypeEditorComponent } from '../../../shared/components/editors/type-editor/type-editor.component';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../services/shared/shared.service';

@Component({
    selector: 'app-types-page',
    templateUrl: './types-page.component.html',
    styleUrls: ['./types-page.component.scss']
})
export class TypesPageComponent implements OnInit, OnDestroy {
    @ViewChild(TypeEditorComponent) editor: TypeEditorComponent;
    iconCardIcon: IconDefinition = faKeyboard;
    deleteIcon:IconDefinition = faMinusCircle;
    restoreIcon: IconDefinition = faUndo;
    upIcon: IconDefinition = faCaretSquareUp;
    downIcon: IconDefinition = faCaretSquareDown;

    private dbEventAbonnement: Subscription;        // Abonneer op aanpassingen in de database
    types: HeliosType[];
    filteredTypes: HeliosType[];
    groepen: HeliosTypesGroep[];
    bedragEenheidActief = false;

    toonGroep: number;

    magToevoegen = true;
    magVerwijderen = true;
    deleteMode = false;        // zitten we in delete mode om types te kunnen verwijderen
    trashMode = false;         // zitten in restore mode om types te kunnen terughalen

    constructor(private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly typesGroepenService: TypesGroepenService) {
    }

    ngOnInit(): void {
        this.typesGroepenService.getTypesGroepen().then((dataset) => {
            this.groepen = dataset;
            if (!this.toonGroep && dataset) {
                this.toonGroep = dataset[0].ID!;
                this.filterGroep(this.toonGroep)
            }
        })
        // Als type is aangepast, moeten we grid opnieuw laden
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Types") {
                this.opvragen();
            }
        });

        this.opvragen();
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
    }

    opvragen() {
        this.typesService.getTypes(this.trashMode).then((dataset) => {
            this.types = dataset!
            this.filterGroep(this.toonGroep)
        });
    }

    filterGroep(toongroep: number) {
        this.toonGroep = toongroep as number;

        if (this.groepen) {
            const groep = this.groepen.find((g) => g.ID == toongroep);
            this.bedragEenheidActief = groep!.BEDRAG_EENHEDEN!;
        }

        this.filteredTypes = this.types.filter((t: HeliosType) => { return t.GROEP == this.toonGroep  });
        this.filteredTypes.sort(function(a, b) {
            return a.SORTEER_VOLGORDE! - b.SORTEER_VOLGORDE!;
        });

        // zorg dat sortering altijd met 1 begint
        for (let i = 0 ; i < this.filteredTypes.length ; i++) {
            this.filteredTypes[i].SORTEER_VOLGORDE = i+1;
        }
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde vliegtuigen getoond
    trashModeJaNee(actief: boolean) {
        this.trashMode = actief;
        this.opvragen();
    }

    // openen van popup om nieuwe start te kunnen invoeren
    addType(): void {
        if (this.magToevoegen) {
            this.editor.openPopup({
                GROEP: this.toonGroep
            });
        }
    }

    // openen van popup om bestaande start te kunnen aanpassen
    openEditor(t: HeliosType) {
        if (!this.deleteMode) {
            this.editor.openPopup(t);
        }
    }

    omlaag(ID: number) {
        const idx = this.filteredTypes.findIndex((t: HeliosType) => { return t.ID == ID})
        this.filteredTypes[idx].SORTEER_VOLGORDE!++;
        this.filteredTypes[idx+1].SORTEER_VOLGORDE!--;

        for (const item of this.filteredTypes) {
            this.typesService.updateType(item);
        }

        this.filteredTypes.sort(function(a, b) {
            return a.SORTEER_VOLGORDE! - b.SORTEER_VOLGORDE!});
    }

    omhoog(ID: number) {
        const idx = this.filteredTypes.findIndex((t: HeliosType) => { return t.ID == ID})
        this.filteredTypes[idx].SORTEER_VOLGORDE!--;
        this.filteredTypes[idx-1].SORTEER_VOLGORDE!++;

        for (const item of this.filteredTypes) {
            this.typesService.updateType(item);
        }
        this.filteredTypes.sort((a, b) => a.SORTEER_VOLGORDE! - b.SORTEER_VOLGORDE!);
    }

    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
    }
}
