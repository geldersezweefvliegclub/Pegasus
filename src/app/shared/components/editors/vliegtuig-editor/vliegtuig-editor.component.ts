import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../modal/modal.component';
import {HeliosType, HeliosVliegtuig} from '../../../../types/Helios';
import {VliegtuigenService} from '../../../../services/apiservice/vliegtuigen.service';
import {TypesService} from '../../../../services/apiservice/types.service';
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {of, Subscription} from "rxjs";

@Component({
    selector: 'app-vliegtuig-editor',
    templateUrl: './vliegtuig-editor.component.html',
    styleUrls: ['./vliegtuig-editor.component.scss']
})
export class VliegtuigEditorComponent  implements  OnInit {
    @Output() add: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() update: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() delete: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() restore: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();

    @ViewChild(ModalComponent) private popup: ModalComponent;

    private vliegtuig: HeliosVliegtuig = {
        ID: undefined,
        REGISTRATIE: undefined,
        CALLSIGN: undefined,
        FLARMCODE: undefined,
        ZITPLAATSEN: undefined,
        ZELFSTART: undefined,
        CLUBKIST: undefined,
        TMG: undefined,
        SLEEPKIST: undefined,
        TYPE_ID: undefined,
        VOLGORDE: undefined,
        INZETBAAR: undefined,
        OPMERKINGEN: undefined
    };
    typesAbonnement: Subscription;
    vliegtuigTypes: HeliosType[];

    isLoading: boolean = false;
    isSaving: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    formTitel: string = "";

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(
        private readonly vliegtuigenService: VliegtuigenService,
        private readonly typesService: TypesService
    ) {}

    ngOnInit(): void {
        // abonneer op wijziging van types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.vliegtuigTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 4});
        });
    }

    openPopup(id: number | null) {
        if (id) {
            this.formTitel = 'Vliegtuig bewerken';
            this.haalVliegtuigOp(id);
        } else {
            this.formTitel = 'Vliegtuig aanmaken';
            this.vliegtuig = {};
        }

        this.isSaving = false;
        this.isVerwijderMode = false;
        this.isRestoreMode = false;
        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }

    haalVliegtuigOp(id: number): void {
        this.isLoading = true;

        try {
            this.vliegtuigenService.getVliegtuig(id).then((vliegtuig) => {
                this.vliegtuig = vliegtuig;
                this.isLoading = false;
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    openVerwijderPopup(id: number) {
        this.haalVliegtuigOp(id);
        this.formTitel = 'Vliegtuig verwijderen';

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    openRestorePopup(id: number) {
        this.haalVliegtuigOp(id);
        this.formTitel = 'Vliegtuig herstellen';

        this.isSaving = false;
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    uitvoeren() {
        this.isSaving = true;
        if (this.isRestoreMode) {
            this.Herstellen(this.vliegtuig);
        }

        if (this.isVerwijderMode) {
            this.Verwijderen(this.vliegtuig);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.vliegtuig.ID) {
                this.Aanpassen(this.vliegtuig);
            } else {
                this.Toevoegen(this.vliegtuig);
            }
        }
    }

    // opslaan van de data van een nieuw vliegtuig
    Toevoegen(vliegtuig: HeliosVliegtuig) {
        this.vliegtuigenService.addVliegtuig(vliegtuig).then(() => {
            const regCall = (vliegtuig.CALLSIGN) ? `${vliegtuig.REGISTRATIE} (${vliegtuig.CALLSIGN})` : vliegtuig.REGISTRATIE;
            this.success = {
                titel: "Vliegtuigen",
                beschrijving: regCall + " is toegevoegd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // bestaand vliegtuig is aangepast. Opslaan van de data
    Aanpassen(vliegtuig: HeliosVliegtuig) {
        this.vliegtuigenService.updateVliegtuig(vliegtuig).then(() => {
            const regCall = (vliegtuig.CALLSIGN) ? `${vliegtuig.REGISTRATIE} (${vliegtuig.CALLSIGN})` : vliegtuig.REGISTRATIE;
            this.success = {
                titel: "Vliegtuigen",
                beschrijving: regCall + " is aangepast"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // markeer een vliegtuig als verwijderd
    Verwijderen(vliegtuig: HeliosVliegtuig) {
        this.vliegtuigenService.deleteVliegtuig(vliegtuig.ID!).then(() => {
            const regCall = (vliegtuig.CALLSIGN) ? `${vliegtuig.REGISTRATIE} (${vliegtuig.CALLSIGN})` : vliegtuig.REGISTRATIE;
            this.success = {
                titel: "Vliegtuigen",
                beschrijving: regCall + " is verwijderd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // de vliegtuig is weer terug, haal de markering 'verwijderd' weg
    Herstellen(vliegtuig: HeliosVliegtuig) {
        this.vliegtuigenService.restoreVliegtuig(vliegtuig.ID!).then(() => {
            const regCall = (vliegtuig.CALLSIGN) ? `${vliegtuig.REGISTRATIE} (${vliegtuig.CALLSIGN})` : vliegtuig.REGISTRATIE;
            this.success = {
                titel: "Vliegtuigen",
                beschrijving: regCall + " is weer beschikbaar"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }
}
