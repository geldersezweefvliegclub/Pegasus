import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from '../../modal/modal.component';
import {
    HeliosCompetenties,
    HeliosCompetentiesDataset,
    HeliosType,
    HeliosVliegtuig,
    HeliosVliegtuigenDataset
} from '../../../../types/Helios';
import {VliegtuigenService} from '../../../../services/apiservice/vliegtuigen.service';
import {TypesService} from '../../../../services/apiservice/types.service';
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {Subscription} from "rxjs";
import {LoginService} from "../../../../services/apiservice/login.service";
import {CompetentieService} from "../../../../services/apiservice/competentie.service";
import {PegasusConfigService} from "../../../../services/shared/pegasus-config.service";

@Component({
    selector: 'app-vliegtuig-editor',
    templateUrl: './vliegtuig-editor.component.html',
    styleUrls: ['./vliegtuig-editor.component.scss']
})
export class VliegtuigEditorComponent  implements  OnInit, OnDestroy {
    @Output() add: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() update: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() delete: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();
    @Output() restore: EventEmitter<HeliosVliegtuig> = new EventEmitter<HeliosVliegtuig>();

    @ViewChild(ModalComponent) private popup: ModalComponent;

    vliegtuig: HeliosVliegtuig = {
        ID: undefined,
        REGISTRATIE: undefined,
        CALLSIGN: undefined,
        FLARMCODE: undefined,
        ZITPLAATSEN: undefined,
        ZELFSTART: undefined,
        CLUBKIST: undefined,
        TMG: undefined,
        SLEEPKIST: undefined,
        TRAINER: undefined,
        TYPE_ID: undefined,
        URL: undefined,
        VOLGORDE: undefined,
        INZETBAAR: undefined,
        BEVOEGDHEID_LOKAAL_ID: undefined,
        BEVOEGDHEID_OVERLAND_ID: undefined,
        OPMERKINGEN: undefined,

    };
    private typesAbonnement: Subscription;
    vliegtuigTypes: HeliosType[];

    isLoading: boolean = false;
    isSaving: boolean = false;

    magWijzigen: boolean = false;

    magClubkistWijzigen: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    formTitel: string = "";

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    PVBs: any[];        // proef van bekwaamheid met kruisjeslijst (lokaal / overland)

    constructor(
        private readonly vliegtuigenService: VliegtuigenService,
        private readonly competentiesService: CompetentieService,
        private readonly configService: PegasusConfigService,
        private readonly loginService: LoginService,
        private readonly typesService: TypesService
    ) {}

    ngOnInit(): void {
        // abonneer op wijziging van vliegtuigTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.vliegtuigTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 4});
        });

        this.PVBs = this.configService.getPVB();
    }

    ngOnDestroy() {
        if (this.typesAbonnement)           this.typesAbonnement.unsubscribe();
    }

    openPopup(vliegtuig: HeliosVliegtuigenDataset | null) {
        if (vliegtuig) {
            // vul alvast de editor met data uit het grid
            this.vliegtuig = {
                ID: vliegtuig.ID,
                REGISTRATIE: vliegtuig.REGISTRATIE,
                CALLSIGN: vliegtuig.CALLSIGN,
                FLARMCODE: vliegtuig.FLARMCODE,
                ZITPLAATSEN: vliegtuig.ZITPLAATSEN,
                ZELFSTART: vliegtuig.ZELFSTART,
                CLUBKIST: vliegtuig.CLUBKIST,
                TMG: vliegtuig.TMG,
                SLEEPKIST: vliegtuig.SLEEPKIST,
                TYPE_ID: vliegtuig.TYPE_ID,
                VOLGORDE: vliegtuig.VOLGORDE,
                INZETBAAR: vliegtuig.INZETBAAR,
                OPMERKINGEN: vliegtuig.OPMERKINGEN
            }

            this.formTitel = 'Vliegtuig bewerken';
            this.haalVliegtuigOp(vliegtuig.ID!); // maar data kan gewijzigd zijn, dus toch even data ophalen van API

            // Voor een bestaand vliegtuig, aanpassen van registratie is beperkt
            // Wanneer lid vliegtuig verkoopt en nieuw vliegtuig koopt, dan kan het zijn dat het callsign op
            // oude en nieuwe vliegtuig hetzelfde is. Dat lokt uit dat lid registratie van bestaande vliegtuig record aanpast
            // alle eerdere vluchten komen dan ook op de nieuwe registratie. Nieuw vliegtuig = new record in database

            // Foutieve invoer kan opgelost worden in toren of door beheerder
            const ui = this.loginService.userInfo?.Userinfo;
            this.magWijzigen = (ui?.isBeheerder || ui?.isStarttoren) ? true : false;
            this.magClubkistWijzigen = (ui?.isBeheerder! || ui?.isCIMT!);
        } else {
            this.formTitel = 'Vliegtuig aanmaken';
            this.vliegtuig = {};
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
            // Alleen tweezitters van de club kunnen een DBO vliegtuig zijn
            if (!this.vliegtuig.CLUBKIST || this.vliegtuig.ZITPLAATSEN != 2) {
                this.vliegtuig.TRAINER = false;
            }

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

    opslaanDisabled() {
        if (!this.vliegtuig.CLUBKIST) {
            return !(this.vliegtuig.REGISTRATIE && this.vliegtuig.ZITPLAATSEN)
        }
        return !(this.vliegtuig.REGISTRATIE && this.vliegtuig.ZITPLAATSEN && this.vliegtuig.VOLGORDE && this.vliegtuig.TYPE_ID)
    }
}
