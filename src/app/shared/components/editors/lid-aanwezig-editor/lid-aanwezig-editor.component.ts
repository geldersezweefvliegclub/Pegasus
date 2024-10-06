import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../modal/modal.component';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import { HeliosAanwezigLedenDataset, HeliosType, HeliosVliegtuigenDataset } from '../../../../types/Helios';
import { Observable, of, Subscription } from 'rxjs';
import { TypesService } from '../../../../services/apiservice/types.service';
import { AanwezigLedenService } from '../../../../services/apiservice/aanwezig-leden.service';
import { VliegtuigenService } from '../../../../services/apiservice/vliegtuigen.service';
import { LoginService } from '../../../../services/apiservice/login.service';
import { StorageService } from '../../../../services/storage/storage.service';

type HeliosTypeExtended = HeliosType & {
    Geselecteerd?: boolean;
}

@Component({
    selector: 'app-lid-aanwezig-editor',
    templateUrl: './lid-aanwezig-editor.component.html',
    styleUrls: ['./lid-aanwezig-editor.component.scss']
})
export class LidAanwezigEditorComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Output() opgeslagen: EventEmitter<number> = new EventEmitter<number>();

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;
    aanwezig: HeliosAanwezigLedenDataset;
    eenheden: number | undefined;

    isDDWVer = false;
    isLoading = false;
    isSaving = false;
    formTitel = "";

    veldenTypes$: Observable<HeliosType[]>;

    private typesAbonnement: Subscription;
    vliegtuigTypes: HeliosTypeExtended[];

    private vliegtuigenAbonnement: Subscription;
    vliegtuigen: HeliosVliegtuigenDataset[] = [];
    vliegtuigenFiltered: HeliosVliegtuigenDataset[] = [];

    constructor(private readonly aanwezigLedenService: AanwezigLedenService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly storageService: StorageService,
                private readonly loginService: LoginService,
                private readonly typesService: TypesService) {
    }

    ngOnInit(): void {
        // abonneer op wijziging van vliegtuigen
        this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
            this.vliegtuigen = (vliegtuigen) ? vliegtuigen : [];
        });

        this.typesService.getClubVliegtuigTypes().then((records) => {
            this.vliegtuigTypes = records;

            for (const item of this.vliegtuigTypes) {
                item.Geselecteerd = false;
            }
            this.vliegtuigTypes.sort(function compareFn(a, b) {
                const vA = (a.SORTEER_VOLGORDE) ? a.SORTEER_VOLGORDE : 100;
                const vB = (b.SORTEER_VOLGORDE) ? b.SORTEER_VOLGORDE : 100;

                return vA - vB;
            });
        })

        // abonneer op wijziging van types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.veldenTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 9}));
        });
    }

    ngOnDestroy() : void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
        if (this.vliegtuigenAbonnement) this.vliegtuigenAbonnement.unsubscribe();
    }

    // open popup, maar haal eerst de aanwezigheid op.
    openPopup(record: HeliosAanwezigLedenDataset, strippen: number | undefined = undefined) {
        const ui = this.loginService.userInfo;
        this.isDDWVer = ui!.Userinfo!.isDDWV!;

        this.aanwezig = record;
        this.eenheden = strippen;

        if (this.isDDWVer) {
            this.vliegtuigenFiltered = this.vliegtuigen.filter((v) => v.CLUBKIST == false);
        }
        else {
            this.vliegtuigenFiltered = this.vliegtuigen;
        }

        // Ophalen uit de database, er kan iets veranderd zijn. Alleen als we bestaand record aanpassen
        if (record.ID) {
            this.isLoading = true
            this.aanwezigLedenService.getAanwezigLid(record.ID!).then((a) => {
                this.isLoading = false;
                this.aanwezig = a;
                this.vliegtuigType2Vinkjes(this.aanwezig!.VOORKEUR_VLIEGTUIG_TYPE);
            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        } else {
            const ui = this.loginService.userInfo?.LidData

            // Als we onszelf aanmelden, dan kijken of een default setting hebben
            if (this.aanwezig.LID_ID == ui!.ID) {
                this.vliegtuigType2Vinkjes(this.storageService.ophalen('aanmeldingVoorkeurVliegtuigsTypes') as string | undefined);
                const vID = this.storageService.ophalen('aanmeldingOverlandVliegtuigID')

                if (vID) {
                    this.aanwezig.OVERLAND_VLIEGTUIG_ID = +vID;     // + teken voor conversie van string naar int
                }
                this.aanwezig.VELD_ID = this.storageService.ophalen("aanmeldingVeldTypes") as number | undefined
            }
            else {
                this.vliegtuigType2Vinkjes("");
            }
        }

        this.formTitel = 'Aanmelding: ' + record.NAAM
        this.popup.open();
    }

    // zet vinkje geselecteerd in de vliegtuig types. Wordt later gebruikt om toe te voegen bij aanmelden
    zetVoorkeur(event: Event, id: number) {
        const idx = this.vliegtuigTypes.findIndex(t => t.ID == id)

        this.vliegtuigTypes[idx].Geselecteerd = (event.target as HTMLInputElement).checked;

        let voorkeur = '';
        for (const item of this.vliegtuigTypes) {
            if (item.Geselecteerd) {
                voorkeur += (voorkeur == '') ? '' : ',';
                voorkeur += item.ID!.toString();
            }
        }
        this.aanwezig.VOORKEUR_VLIEGTUIG_TYPE = (voorkeur !== "") ? voorkeur : undefined;
    }

    vliegtuigType2Vinkjes(types: string | undefined) {
        this.vliegtuigTypes.forEach((vliegtuigType) => {
            vliegtuigType.Geselecteerd = false;
        });

        if (types) {
            types.split(',').forEach((vliegtuigTypeID) => {
                const idx = this.vliegtuigTypes.findIndex(t => t.ID == parseInt(vliegtuigTypeID))

                if (idx >= 0) {
                    this.vliegtuigTypes[idx].Geselecteerd = true;
                }
            });
        }
    }

    opslaan() {
        this.isSaving = true;

        const ui = this.loginService.userInfo?.LidData

        // Als we onszelf aanmelden, dan onthouden we welke vliegtuigtypes / voorkeur vliegtuif we ingevoerd hebben
        if (this.aanwezig.LID_ID == ui!.ID) {
            this.storageService.opslaan("aanmeldingVeldTypes", this.aanwezig.VELD_ID, -1);
            this.storageService.opslaan("aanmeldingVoorkeurVliegtuigsTypes", this.aanwezig.VOORKEUR_VLIEGTUIG_TYPE, -1);
            this.storageService.opslaan("aanmeldingOverlandVliegtuigID", this.aanwezig!.OVERLAND_VLIEGTUIG_ID ? this.aanwezig!.OVERLAND_VLIEGTUIG_ID.toString() : null, -1);
        }

        // update of nieuwe aanmelding
        if (this.aanwezig.ID) {
            this.aanwezigLedenService.updateAanmelding(this.aanwezig).then(a => {
                this.success = {titel: "Aanmelden", beschrijving: "Aanmelden bijgewerkt"}
                this.aanwezigLedenService.updateAanwezigCache();
                this.opgeslagen.emit(a.ID);

                this.aanwezig = a;
                this.isSaving = false;
                this.popup.close();
            }).catch(e => {
                this.error = e;
                this.isSaving = false;
            })
        } else {
            this.aanwezigLedenService.aanmelden(this.aanwezig).then((a) => {
                this.success = {titel: "Aanmelden", beschrijving: "Aanmelding is geslaagd"}
                this.aanwezigLedenService.updateAanwezigCache();
                this.opgeslagen.emit(a.ID);

                this.isSaving = false;
                this.popup.close();
            }).catch(e => {
                this.error = e;
                this.isSaving = false;
            });
        }
    }

    knopUit(): boolean {
        if (this.aanwezig) {
            return !(this.aanwezig.VELD_ID! > 0)
        }
        return true;
    }
}
