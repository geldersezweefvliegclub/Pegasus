import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {
    HeliosJournaal, HeliosLedenDataset,
    HeliosType,
    HeliosVliegtuigenDataset
} from "../../../../types/Helios";
import {TypesService} from "../../../../services/apiservice/types.service";
import {Observable, of, Subscription} from "rxjs";
import {ModalComponent} from "../../modal/modal.component";
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {JournaalService} from "../../../../services/apiservice/journaal.service";
import {VliegtuigenService} from "../../../../services/apiservice/vliegtuigen.service";
import {LedenService} from "../../../../services/apiservice/leden.service";
import {SharedService} from "../../../../services/shared/shared.service";
import {LoginService} from "../../../../services/apiservice/login.service";

@Component({
    selector: 'app-melding-editor',
    templateUrl: './journaal-editor.component.html',
    styleUrls: ['./journaal-editor.component.scss']
})
export class JournaalEditorComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    private vliegtuigenAbonnement: Subscription;
    clubVliegtuigen$: Observable<HeliosVliegtuigenDataset[]>;

    private ledenAbonnement: Subscription;
    techneuten$: Observable<HeliosLedenDataset[]>;

    private typesAbonnement: Subscription;
    rollend$: Observable<HeliosType[]>;

    categorie: HeliosType[];
    status: HeliosType[];

    isLoading: boolean = false;
    isSaving: boolean = false;

    magWijzigen: boolean = true;
    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    formTitel: string = "";

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    melding: HeliosJournaal = {}

    constructor(private readonly typesService: TypesService,
                private readonly ledenService: LedenService,
                private readonly loginService: LoginService,
                private readonly journaalService: JournaalService,
                private readonly vliegtuigenService: VliegtuigenService) {
    }

    ngOnInit(): void {
        // abonneer op wijziging van rollend materieel
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.rollend$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP === 23})); // 23 is rollend materieel
            this.categorie = dataset!.filter((t: HeliosType) => { return t.GROEP === 24 });  // 24 is categorie
            this.status = dataset!.filter((t: HeliosType) => { return t.GROEP === 25 });     // 25 is status van de melding
        });

        // abonneer op wijziging van vliegtuigen
        this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
            this.clubVliegtuigen$ = of(vliegtuigen!.filter((v) => { return v.CLUBKIST!; }));
        });

        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.techneuten$ = of((leden) ? leden.filter((l) => { return l.TECHNICUS}) : []);
        });
    }

    ngOnDestroy() {
        if (this.typesAbonnement)           this.typesAbonnement.unsubscribe();
        if (this.ledenAbonnement)           this.ledenAbonnement.unsubscribe();
        if (this.vliegtuigenAbonnement)     this.vliegtuigenAbonnement.unsubscribe();
    }

    openPopup(melding: HeliosJournaal | null) {
        if (melding) {
            // vul alvast de editor met starts uit het grid
            this.melding = {
                ID: melding.ID,
                DATUM: melding.DATUM,
                VLIEGTUIG_ID: melding.VLIEGTUIG_ID,
                ROLLEND_ID: melding.ROLLEND_ID,
                TITEL: melding.TITEL,
                OMSCHRIJVING: melding.OMSCHRIJVING,
                MELDER_ID: melding.MELDER_ID,
                TECHNICUS_ID: melding.TECHNICUS_ID,
                AFGETEKEND_ID: melding.AFGETEKEND_ID,
                STATUS_ID: melding.STATUS_ID,
                CATEGORIE_ID: melding.CATEGORIE_ID
            }

            this.formTitel = 'Melding bewerken';
            this.haalMeldingOp(melding.ID!); // maar melding kan gewijzigd zijn, dus toch even starts ophalen van API
        } else {
            this.melding = {
                ID: undefined,
                DATUM: undefined,
                VLIEGTUIG_ID: undefined,
                ROLLEND_ID: undefined,
                TITEL: undefined,
                OMSCHRIJVING: undefined,
                MELDER_ID: undefined,
                TECHNICUS_ID: undefined,
                AFGETEKEND_ID: undefined,
                STATUS_ID: 2501,
                CATEGORIE_ID: undefined
            }

            this.formTitel = 'Melding aanmaken';
            this.magWijzigen = true;
        }

        this.isSaving = false;
        this.isVerwijderMode = false;
        this.isRestoreMode = false;
        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }

    haalMeldingOp(id: number): void {
        this.isLoading = true;

        try {
            this.journaalService.getJournaal(id).then((melding) => {
                this.melding = melding;
                this.isLoading = false;
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    openVerwijderPopup(id: number) {
        this.haalMeldingOp(id);
        this.formTitel = 'Melding verwijderen';

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    openRestorePopup(id: number) {
        this.haalMeldingOp(id);
        this.formTitel = 'Melding herstellen';

        this.isSaving = false;
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    uitvoeren() {
        this.isSaving = true;
        if (this.isRestoreMode) {
            this.Herstellen(this.melding);
        }

        if (this.isVerwijderMode) {
            this.Verwijderen(this.melding);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.melding.ID) {
                this.Aanpassen(this.melding);
            } else {
                this.Toevoegen(this.melding);
            }
        }
    }

    // opslaan van de starts van een nieuw vliegtuig
    Toevoegen(melding: HeliosJournaal) {
        this.journaalService.addJournaal(melding).then(() => {
            this.success = {
                titel: "Journaal",
                beschrijving: "Melding is toegevoegd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // bestaand vliegtuig is aangepast. Opslaan van de starts
    Aanpassen(melding: HeliosJournaal) {
        this.journaalService.updateJournaal(melding).then(() => {
            this.success = {
                titel: "Journaal",
                beschrijving: "Melding is aangepast"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // markeer een vliegtuig als verwijderd
    Verwijderen(melding: HeliosJournaal) {
        this.journaalService.deleteJournaal(melding.ID!).then(() => {
            this.success = {
                titel: "Journaal",
                beschrijving: "Melding is verwijderd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // de vliegtuig is weer terug, haal de markering 'verwijderd' weg
    Herstellen(melding: HeliosJournaal) {
        this.journaalService.restoreJournaal(melding.ID!).then(() => {
            this.success = {
                titel: "Journaal",
                beschrijving: "Melding is weer beschikbaar"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    superGebruiker() {
        const ui = this.loginService.userInfo?.LidData;
        return (ui?.BEHEERDER || ui?.CIMT || ui?.INSTRUCTEUR || ui?.TECHNICUS) ? true : false;
    }

    opslaanDisabled(): boolean {
        return ((this.melding.ROLLEND_ID === undefined) && (this.melding.VLIEGTUIG_ID === undefined))
    }
}
