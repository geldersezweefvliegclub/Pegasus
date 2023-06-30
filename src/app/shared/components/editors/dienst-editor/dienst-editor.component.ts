import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {ModalComponent} from "../../modal/modal.component";
import {HeliosRoosterDagExtended} from "../../../../schermen/rooster/rooster-page/rooster-page.component";
import {Subscription} from "rxjs";
import {HeliosDienst, HeliosLedenDataset, HeliosType} from "../../../../types/Helios";
import {TypesService} from "../../../../services/apiservice/types.service";
import {LedenService} from "../../../../services/apiservice/leden.service";
import {PegasusConfigService} from "../../../../services/shared/pegasus-config.service";
import {DienstenService} from "../../../../services/apiservice/diensten.service";

@Component({
    selector: 'app-dienst-editor',
    templateUrl: './dienst-editor.component.html',
    styleUrls: ['./dienst-editor.component.scss']
})
export class DienstEditorComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    private typesAbonnement: Subscription;
    dienstTypes: HeliosType[] = [];

    private ledenAbonnement: Subscription;
    private leden: HeliosLedenDataset[] = [];
    filteredLeden: HeliosLedenDataset[] = [];

    private dag: HeliosRoosterDagExtended;
    private typeDienstID: number;

    datumDMY: string;
    lidID: number | undefined;
    dienstBeschrijving: string;
    isSaving: boolean;

    constructor(private readonly typesService: TypesService,
                private readonly ledenService: LedenService,
                private readonly dienstenService: DienstenService,
                private readonly configService: PegasusConfigService) {
    }

    ngOnInit(): void {
        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.leden = (leden) ? leden : [];
        });

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.dienstTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 18
            });    // type diensten
        });
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
        if (this.ledenAbonnement) this.ledenAbonnement.unsubscribe();
    }

    // Openen van popup scherm
    openPopup(dag: HeliosRoosterDagExtended, typeDienstID: number) {
        this.dag = dag;
        this.typeDienstID = typeDienstID;

        const d = dag.DATUM!.split('-');
        this.datumDMY = d[2] + '-' + d[1] + '-' + d[0];
        this.lidID = (dag.Diensten[typeDienstID]) ? dag.Diensten[typeDienstID].LID_ID! : undefined;

        const t: HeliosType | undefined = this.dienstTypes.find(t => t.ID == typeDienstID)
        this.dienstBeschrijving = (t) ? t.OMSCHRIJVING! : "<onbekend>"

        this.filteredLeden = this.leden.filter((lid: HeliosLedenDataset) => {
            if (lid.ID == this.lidID) return true;

            if (dag.CLUB_BEDRIJF) {
                switch (typeDienstID) {
                    case this.configService.OCHTEND_DDI_TYPE_ID:
                    case this.configService.MIDDAG_DDI_TYPE_ID:
                    case this.configService.OCHTEND_INSTRUCTEUR_TYPE_ID:
                    case this.configService.MIDDAG_INSTRUCTEUR_TYPE_ID: {
                        if (lid.INSTRUCTEUR) {
                            return true;
                        }
                        break;
                    }
                    case this.configService.OCHTEND_LIERIST_TYPE_ID:
                    case this.configService.MIDDAG_LIERIST_TYPE_ID:
                    {
                        return lid.LIERIST;
                    }
                    case this.configService.OCHTEND_HULPLIERIST_TYPE_ID:
                    case this.configService.MIDDAG_HULPLIERIST_TYPE_ID: {
                        return lid.LIERIST_IO;
                    }
                    case this.configService.OCHTEND_STARTLEIDER_TYPE_ID:
                    case this.configService.MIDDAG_STARTLEIDER_TYPE_ID:
                    case this.configService.OCHTEND_STARTLEIDER_IO_TYPE_ID:
                    case this.configService.MIDDAG_STARTLEIDER_IO_TYPE_ID: {
                        return lid.STARTLEIDER;
                    }
                    case this.configService.GASTEN_VLIEGER1_TYPE_ID:
                    case this.configService.GASTEN_VLIEGER2_TYPE_ID: {
                        return lid.GASTENVLIEGER;
                    }
                    case this.configService.SLEEPVLIEGER_TYPE_ID: {
                        return lid.SLEEPVLIEGER;
                    }
                    default: {
                        return false;
                    }
                }
            } else if (dag.DDWV) {
                return (lid.DDWV_CREW)
            }
            return false;
        });
        this.popup.open();
    }

    lidGeselecteerd(id: number | undefined) {
        this.lidID = id;
    }

    opslaan() {
        const id = (this.dag.Diensten[this.typeDienstID]) ? +this.dag.Diensten[this.typeDienstID].ID! : -1;
        this.isSaving = true;

        if (!this.lidID && id >= 0) {
            this.dienstenService.deleteDienst(id).then(() => {
                this.success = {
                    titel: "Rooster",
                    beschrijving: "Dienst verwijderd"
                }
                this.isSaving = false;
                this.popup.close();
            });
        } else {
            if (id >= 0) {
                const d: HeliosDienst = {
                    ID: id,
                    ROOSTER_ID: this.dag.ID,
                    DATUM: this.dag.DATUM,
                    TYPE_DIENST_ID: this.typeDienstID,
                    LID_ID: this.lidID
                }

                this.dienstenService.updateDienst(d).then(() => {
                    this.success = {
                        titel: "Rooster",
                        beschrijving: "Dienst aangepast"
                    }
                    this.isSaving = false;
                    this.popup.close();
                }).catch(e => {
                    this.isSaving = false;
                    this.error = e;
                });
            } else {
                const d: HeliosDienst = {
                    DATUM: this.dag.DATUM,
                    ROOSTER_ID: this.dag.ID,
                    TYPE_DIENST_ID: this.typeDienstID,
                    LID_ID: this.lidID
                }

                this.dienstenService.addDienst(d).then(() => {
                    this.success = {
                        titel: "Rooster",
                        beschrijving: "Dienst toegevoegd"
                    }
                    this.isSaving = false;
                    this.popup.close();
                }).catch(e => {
                    this.isSaving = false;
                    this.error = e;
                });
            }
        }
    }
}
