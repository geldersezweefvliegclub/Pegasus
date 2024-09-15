import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal.component';
import { HeliosCompetentie, HeliosCompetentiesDataset, HeliosType } from '../../../../types/Helios';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import { CompetentieService } from '../../../../services/apiservice/competentie.service';
import { Observable, of, Subscription } from 'rxjs';
import { TypesService } from '../../../../services/apiservice/types.service';

export interface CompetentieLijst {
    ID: number | undefined;
    label: string | undefined;
}

@Component({
    selector: 'app-competentie-editor',
    templateUrl: './competentie-editor.component.html',
    styleUrls: ['./competentie-editor.component.scss']
})
export class CompetentieEditorComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    formTitel: string;

    private typesAbonnement: Subscription;
    topLevels: HeliosType[];

    private competentiesAbonnement: Subscription;
    lijst$: Observable<CompetentieLijst[]>;
    competenties: HeliosCompetentiesDataset[] = [];
    competentie: HeliosCompetentie = {};
    isLoading = false;
    isSaving = false;

    isVerwijderMode = false;
    isRestoreMode = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly typesService: TypesService,
                private readonly competentieService: CompetentieService) {
    }

    ngOnInit() {
        // abonneer op wijziging van top level competenties
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.topLevels = dataset!.filter((t:HeliosType) => { return t.GROEP == 10});
        });

        // abonneer op wijziging van competenties
        this.competentiesAbonnement = this.competentieService.competentiesChange.subscribe(dataset => {
            this.competenties = dataset!;
            this.filterBovenliggend()
        });
    }

    ngOnDestroy(): void {
        if (this.competentiesAbonnement) this.competentiesAbonnement.unsubscribe();
        if (this.typesAbonnement)        this.typesAbonnement.unsubscribe();
    }

    // Open invoer popup voor de track. Als track ingevuld is, wijzigen we bestaande track
    openPopup(competentie: HeliosCompetentie) {
        this.competentie = competentie;   // vul alvast de editor met starts uit het grid
        if (competentie.ID) {
            this.formTitel = 'Bewerken';
            this.haalCompetentieOp(competentie.ID!);    // maar starts kan gewijzigd zijn, dus toch even starts ophalen van API
        } else {
            this.formTitel = "Toevoegen"
        }
        this.isSaving = false;
        this.isVerwijderMode = false;
        this.isRestoreMode = false;
        this.filterBovenliggend()
        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }

    // ophalen van type uit de database (via API)
    haalCompetentieOp(id: number): void {
        this.isLoading = true;

        try {
            this.competentieService.getCompetentie(id).then((competentie: HeliosCompetentie) => {
                this.competentie = competentie;
                this.isLoading = false;
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    // Toon popup om type te verwijderen
    openVerwijderPopup(id: number) {
        this.haalCompetentieOp(id);
        this.formTitel = 'Verwijderen';

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    // Toon popup om type uit de archief te halen
    openRestorePopup(id: number) {
        this.haalCompetentieOp(id);
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
            this.Herstellen(this.competentie);
        }

        if (this.isVerwijderMode) {
            this.Verwijderen(this.competentie);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.competentie.ID) {
                this.Aanpassen(this.competentie);
            } else {
                this.Toevoegen(this.competentie);
            }
        }
    }

    // opslaan in de database
    Toevoegen(competentie: HeliosCompetentie) {
        this.competentieService.addCompetentie(competentie).then(() => {
            this.success = {
                titel: "Competentie",
                beschrijving: "Competentie is toegevoegd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // bestaande type is aangepast. Opslaan van het type
    Aanpassen(competentie: HeliosCompetentie) {
        this.competentieService.updateCompetentie(competentie).then(() => {
            this.success = {
                titel: "Competentie",
                beschrijving: "Competentie is gewijzigd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // markeer een type als verwijderd
    Verwijderen(competentie: HeliosCompetentie) {
        this.competentieService.deleteCompetentie(competentie.ID!).then(() => {
            this.success = {
                titel: "Competentie",
                beschrijving: "Competentie is verwijderd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // het type herstellen, haal de markering 'verwijderd' weg
    Herstellen(competentie: HeliosCompetentie) {
        this.competentieService.restoreCompetentie(competentie.ID!).then(() => {
            this.success = {
                titel: "Competentie",
                beschrijving: "Competentie is weer beschikbaar"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // Opslaan knop staat uit als we niet weten over wie het gaat, of er nog geen tekst is ingevoerd
    opslaanDisabled() {
        return !this.competentie.ONDERWERP
    }

    parentChange(parentID: number) {
        const parent = this.competenties.find(c => c.ID == parentID);

        if (parent) {
            this.competentie.BLOK_ID = parent.ID;
            this.competentie.LEERFASE_ID = parent.LEERFASE_ID;
        }
    }

    filterBovenliggend() {
        const l = this.competenties.filter((c:HeliosCompetentiesDataset) => { return c.LEERFASE_ID == this.competentie.LEERFASE_ID})
        this.lijst$ = of(l.map((i) => {
            const l: CompetentieLijst = {
                ID: i.ID,
                label: '[' + i.ID + '] ' + i.ONDERWERP
            }
            return l;
        }))
    }
}


