import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
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
import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { StatusButtonComponent } from '../../../shared/components/status-button/status-button.component';
import { DecimalPipe } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ErrorMessage } from '../../../types/Utils';
import { ErrorComponent } from '../../../shared/components/error/error.component';

@Component({
    selector: 'app-types-page',
    host: { class: 'scherm-pagina' },
    templateUrl: './types-page.component.html',
    styleUrls: ['./types-page.component.scss'],
    imports: [CdkDrag, CdkDropList, ErrorComponent, PegasusCardComponent, FormsModule, FaIconComponent, IconButtonComponent, StatusButtonComponent, TypeEditorComponent, DecimalPipe]
})
export class TypesPageComponent implements OnInit, OnDestroy {
    private readonly typesService = inject(TypesService);
    private readonly sharedService = inject(SharedService);
    private readonly typesGroepenService = inject(TypesGroepenService);

    readonly editor = viewChild.required(TypeEditorComponent);
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
    trashMode = false;
    error: ErrorMessage | undefined;
    protected geselecteerdID: number | undefined;   // aangeklikte regel, alleen die krijgt de omhoog / omlaag pijlen

    private volgordeOpslaan = false;    // tijdens het opslaan van de volgorde niet bij elke update opnieuw ophalen

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
            if (ev.tabel == "Types" && !this.volgordeOpslaan) {
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
        this.filteredTypes.sort((a, b) => (a.SORTEER_VOLGORDE ?? 0) - (b.SORTEER_VOLGORDE ?? 0));
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde vliegtuigen getoond
    trashModeJaNee(actief: boolean) {
        this.trashMode = actief;
        this.opvragen();
    }

    // openen van popup om nieuwe start te kunnen invoeren
    addType(): void {
        if (this.magToevoegen) {
            this.editor().openPopup({
                GROEP: this.toonGroep
            });
        }
    }

    // openen van popup om bestaande start te kunnen aanpassen
    openEditor(t: HeliosType) {
        if (!this.deleteMode) {
            this.editor().openPopup(t);
        }
    }

    protected omlaag(ID: number) {
        this.verplaats(ID, 1);
    }

    protected omhoog(ID: number) {
        this.verplaats(ID, -1);
    }

    // Een type is in de lijst versleept naar een andere plek (CDK drag & drop)
    protected naVerslepen(event: CdkDragDrop<HeliosType[]>) {
        if (event.previousIndex === event.currentIndex) {
            return;
        }
        moveItemInArray(this.filteredTypes, event.previousIndex, event.currentIndex);
        this.geselecteerdID = this.filteredTypes[event.currentIndex].ID;
        this.opslaanVolgorde();
    }

    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
    }

    // Verplaats een type één plek omlaag (+1) of omhoog (-1) binnen de groep, door de plek te wisselen met de buurman
    private verplaats(ID: number, richting: 1 | -1) {
        const idx = this.filteredTypes.findIndex(t => t.ID == ID);
        const buur = idx + richting;
        if (idx < 0 || buur < 0 || buur >= this.filteredTypes.length) {
            return;     // staat al bovenaan of onderaan
        }

        [this.filteredTypes[idx], this.filteredTypes[buur]] = [this.filteredTypes[buur], this.filteredTypes[idx]];
        this.opslaanVolgorde();
    }

    // Nummer SORTEER_VOLGORDE van de groep opnieuw 1, 2, 3, ... in de volgorde van filteredTypes, zodat die uniek is
    // binnen de groep. Alleen records waarvan de volgorde echt verandert gaan naar de server, bij één plek verschuiven
    // normaal twee. Zitten er gaten of dubbele nummers in, dan worden die meteen rechtgezet (dan eenmalig meer).
    // Iedere update vuurt een Types event af, dat zou de lijst per record opnieuw ophalen. Daarom staat dat tijdens
    // het opslaan uit en halen we na afloop één keer op
    private opslaanVolgorde() {
        const gewijzigd: HeliosType[] = [];
        this.filteredTypes.forEach((t, i) => {
            if (t.SORTEER_VOLGORDE !== i + 1) {
                t.SORTEER_VOLGORDE = i + 1;
                gewijzigd.push(t);
            }
        });
        if (gewijzigd.length === 0) {
            return;
        }

        this.volgordeOpslaan = true;
        Promise.all(gewijzigd.map(t => this.typesService.updateType(t)))
            .catch(e => this.error = e)
            .finally(() => {
                this.volgordeOpslaan = false;
                this.opvragen();
            });
    }
}
