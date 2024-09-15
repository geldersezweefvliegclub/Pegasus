import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../../modal/modal.component";
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faCloudSunRain, faFlagCheckered, faFrown, faTruck} from "@fortawesome/free-solid-svg-icons";
import {faPaperPlane} from "@fortawesome/free-solid-svg-icons/faPaperPlane";
import {ComposeMeteoComponent} from "./compose-meteo/compose-meteo.component";
import {ComposeBedrijfComponent} from "./compose-bedrijf/compose-bedrijf.component";
import {faArtstation} from "@fortawesome/free-brands-svg-icons";
import {DateTime} from "luxon";
import {Observable, of, Subscription} from "rxjs";
import {SchermGrootte, SharedService} from "../../../../services/shared/shared.service";
import {
    HeliosDagRapport, HeliosTrack,
    HeliosType
} from "../../../../types/Helios";
import {TypesService} from "../../../../services/apiservice/types.service";
import {DagRapportenService} from "../../../../services/apiservice/dag-rapporten.service";

@Component({
    selector: 'app-dag-rapport-editor',
    templateUrl: './dag-rapport-editor.component.html',
    styleUrls: ['./dag-rapport-editor.component.scss']
})
export class DagRapportEditorComponent implements OnInit, OnDestroy {
    @Input() veld_id: number | undefined;
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @ViewChild(ComposeMeteoComponent) private meteoWizard: ComposeMeteoComponent;
    @ViewChild(ComposeBedrijfComponent) private bedrijfWizard: ComposeBedrijfComponent;

    @Output() aangepast: EventEmitter<number> = new EventEmitter<number>();

    private readonly iconMeteo: IconDefinition = faCloudSunRain;
    protected readonly iconVliegend: IconDefinition = faPaperPlane;
    protected readonly iconRollend: IconDefinition = faTruck;
    protected readonly iconVerslag: IconDefinition = faFlagCheckered;
    protected readonly iconIncident: IconDefinition = faFrown;
    private readonly iconBedrijf: IconDefinition = faArtstation;

    private datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime = DateTime.now();              // de gekozen dag

    private typesAbonnement: Subscription;
    veldTypes$: Observable<HeliosType[]>;

    dagRapport: HeliosDagRapport;
    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    isSaving: boolean = false;
    isLoading: boolean = false;
    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;

    formTitel: string = "";

    constructor(private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly dagRapportenService: DagRapportenService) {
    }

    ngOnInit(): void {
        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.veldTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 9}));            // vliegvelden
        });

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
        })
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement)       this.typesAbonnement.unsubscribe();
        if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
    }

    // ophalen van een dag rapport
    ophalen(id:number) {
        this.isLoading = true;
        this.dagRapportenService.getDagRapport(id).then ((dr) => {
            this.dagRapport = dr
            this.isLoading = false;
        }).catch(e => {
            this.isLoading = false;
        });
    }

    // Openen van popup scherm
    openPopup(dagRapport: HeliosDagRapport|undefined = undefined) {
        this.isVerwijderMode = false;
        this.isRestoreMode = false;

        if (dagRapport) {
            this.dagRapport = dagRapport;
            this.ophalen(dagRapport.ID!)
            this.formTitel = "Aanpassen dag rapport voor " + this.sharedService.datumDMJ(dagRapport.DATUM!)
        }
        else {
            this.dagRapport = {
                DATUM: this.datum.toISODate() as string,
                VELD_ID: this.veld_id
            }
            this.formTitel = "Nieuw dag rapport voor " + this.sharedService.datumDMJ(this.datum.toISODate() as string)
        }
        this.popup.open();
    }

    // Toon popup om dagrapport te verwijderen
    openVerwijderPopup(dagRapport: HeliosDagRapport) {
        this.ophalen(dagRapport.ID!);
        this.formTitel = "Dag rapport verwijderen voor " + this.sharedService.datumDMJ(dagRapport.DATUM!)

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    // Toon popup om dagrapport uit de prullenbak te halen
    openRestorePopup(dagRapport: HeliosDagRapport) {
        this.ophalen(dagRapport.ID!);
        this.formTitel = "Dag rapport herstellen voor " + this.sharedService.datumDMJ(dagRapport.DATUM!)

        this.isSaving = false;
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    // uitvoeren van de actie waar we mee bezig zijn
    uitvoeren() {
        this.isSaving = true;
        if (this.isRestoreMode) {
            this.Herstellen(this.dagRapport);
        }

        if (this.isVerwijderMode) {
            this.Verwijderen(this.dagRapport);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.dagRapport.ID) {
                this.Aanpassen(this.dagRapport);
            } else {
                this.Toevoegen(this.dagRapport);
            }
        }
    }

    // opslaan van de starts van een nieuwe dag rapport
    Toevoegen(dr:HeliosDagRapport) {
        this.dagRapportenService.addDagRapport(this.dagRapport).then((dr) => {
            this.isSaving = false;
            this.success = {
                titel: "Dag rapporten",
                beschrijving: "Rapport is toegevoegd"
            }
            this.dagRapport = dr;
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // bestaande dag rapport is aangepast.
    Aanpassen(dr:HeliosDagRapport) {
        this.dagRapportenService.updateDagRapport(this.dagRapport).then((dr) => {
            this.isSaving = false;
            this.success = {
                titel: "Dag rapporten",
                beschrijving: "Rapport is aangepast"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        });
    }

    // markeer een track als verwijderd
    Verwijderen(dr:HeliosDagRapport) {
        this.dagRapportenService.deleteDagRapport(dr.ID!).then(() => {
            this.success = {
                titel: "Dag rapporten",
                beschrijving: "Rapport is verwijderd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // de track herstellen, haal de markering 'verwijderd' weg
    // markeer een track als verwijderd
    Herstellen(dr:HeliosDagRapport) {
        this.dagRapportenService.restoreRapport (dr.ID!).then(() => {
            this.success = {
                titel: "Dag rapporten",
                beschrijving: "Rapport is hersteld"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // sluiten van window en inform parent dat data aangepast is.
    closePopup() {
        this.aangepast.emit(this.dagRapport.ID)
        this.popup.close();
    }

    // Hoe groot moet de popup worden
    popupClass() {
        return (this.sharedService.getSchermSize() > SchermGrootte.md) ? "popupMedium" : "popupLarge";
    }

    // Wizard om tekst te genereren voor meteo input. Tekst kan daarna aangepast worden
    invullenMeteo() {
        this.meteoWizard.openPopup();
    }

    // Wizard om tekst te genereren voor vliegbedrijf. Tekst kan daarna aangepast worden
    invullenVliegbedrijf() {
        this.bedrijfWizard.openPopup();
    }
}
