import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import { ModalComponent } from '../../modal/modal.component';
import { HeliosGast, HeliosType } from '../../../../types/Helios';
import { GastenService } from '../../../../services/apiservice/gasten.service';
import { Observable, of, Subscription } from 'rxjs';
import { TypesService } from '../../../../services/apiservice/types.service';
import { ErrorComponent } from '../../error/error.component';
import { SuccessComponent } from '../../success/success.component';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { IconButtonComponent } from '../../icon-button/icon-button.component';
import { LoaderComponent } from '../../loader/loader.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-gast-editor',
    templateUrl: './gast-editor.component.html',
    styleUrls: ['./gast-editor.component.scss'],
    imports: [ErrorComponent, SuccessComponent, ModalComponent, NgSelectComponent, FormsModule, IconButtonComponent, LoaderComponent, AsyncPipe]
})
export class GastEditorComponent implements OnInit, OnDestroy {
    private readonly gastenService = inject(GastenService);
    private readonly typesService = inject(TypesService);

    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() refresh: EventEmitter<void> = new EventEmitter<void>();

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    isLoading = false;
    isSaving = false;

    gast: HeliosGast;

    private typesAbonnement: Subscription;
    veldenTypes$: Observable<HeliosType[]>;

    ngOnInit(): void {
        // abonneer op wijziging van types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.veldenTypes$ = of(dataset!.filter((t: HeliosType) => {
                return t.GROEP == 9
            }));
        })
    }

    ngOnDestroy() : void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
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
        this.gastenService.deleteGast(this.gast!.ID!).then(() => {
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
            this.gastenService.addGast(this.gast).then((_) => {
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

    knopUit(): boolean {
        if (this.gast) {
            return !(this.gast.VELD_ID! > 0)
        }
        return true;
    }
}
