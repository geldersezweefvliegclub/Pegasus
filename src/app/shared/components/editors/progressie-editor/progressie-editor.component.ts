import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';
import {
    HeliosBehaaldeProgressieDataset,
    HeliosCompetentiesDataset,
    HeliosLid,
    HeliosType,
} from '../../../../types/Helios';
import { ModalComponent } from '../../modal/modal.component';
import { ProgressieService } from '../../../../services/apiservice/progressie.service';
import { LoginService } from '../../../../services/apiservice/login.service';
import { LedenService } from '../../../../services/apiservice/leden.service';
import { Subscription } from 'rxjs';
import { TypesService } from '../../../../services/apiservice/types.service';
import { NgbDate, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-progressie-editor',
    templateUrl: './progressie-editor.component.html',
    styleUrls: ['./progressie-editor.component.scss']
})
export class ProgressieEditorComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Input() competenties: HeliosCompetentiesDataset[];
    @Input() vliegerID: number;

    @Output() aangepast: EventEmitter<number> = new EventEmitter<number>();

    kalenderEersteDatum: NgbDateStruct;
    kalenderLaatsteDatum: NgbDateStruct;

    isSaving = false;
    isLoading = false;
    isVerwijderMode = false;

    formTitel = "";
    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    lid: HeliosLid;
    progressie: HeliosBehaaldeProgressieDataset = {};
    competentie: HeliosCompetentiesDataset | undefined
    competentieString: string

    private typesAbonnement: Subscription;
    topLevels: HeliosType[];

    geldigTot: DateTime | undefined;

    constructor(private readonly loginService: LoginService,
                private readonly ledenService: LedenService,
                private readonly typesService: TypesService,
                private readonly progressieService: ProgressieService) {
    }

    ngOnInit() {
        // abonneer op wijziging van top level competenties
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.topLevels = dataset!.filter((t:HeliosType) => { return t.GROEP == 10});
        });

        const nu = new Date()
        this.kalenderEersteDatum = {year: nu.getFullYear(), month: nu.getMonth()+1, day: nu.getDay()+1}
        this.kalenderLaatsteDatum = {year: nu.getFullYear() + 4, month: 12, day: 31}
    }

    ngOnDestroy() {
        if (this.typesAbonnement)        this.typesAbonnement.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        // ophalen van lid gegevens
        if (changes.hasOwnProperty("vliegerID")) {
            const ui = this.loginService.userInfo?.Userinfo;
            if (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) {
                this.ledenService.getLid(this.vliegerID).then((l) => this.lid = l)
            }
        }
    }

    // ophalen van een dag rapport
    async ophalen(id:number): Promise<HeliosBehaaldeProgressieDataset> {
        this.isLoading = true;
        this.progressieService.getProgressie(id).then ((p) => {
            this.progressie = p;
            this.isLoading = false;
        }).catch(e => {
            this.isLoading = false;
        });
        this.geldigTot = (this.progressie.GELDIG_TOT) ? DateTime.fromSQL(this.progressie.GELDIG_TOT) : undefined;
        return this.progressie;
    }

    // Openen van popup scherm voor nieuwe invoer
    openNieuwPopup(competentieID: number) {
        this.isVerwijderMode = false;
        this.isLoading = false;
        this.isSaving = false;
        this.competentie = this.competenties.find((c) => c.ID == competentieID)

        if (!this.competentie)
        {
            console.error(this.competenties);
            const errorString = "Competentie met ID " + competentieID + " niet gevonden";
            this.error = {
                beschrijving: errorString
            }
        }
        else {
            this.competentieString = this.vullenCompetentieString(this.competentie!.ID!);

            const ui = this.loginService.userInfo?.LidData;
            this.progressie = {
                LID_ID: this.vliegerID,
                INSTRUCTEUR_ID: ui?.ID,
                COMPETENTIE_ID: competentieID
            }

            if (this.competentie?.SCORE) {
                this.progressie.SCORE = 1;
            }
            this.formTitel = "Nieuwe progressie voor " + this.lid.NAAM
            this.popup.open();
        }
    }

    // Openen van popup scherm voor nieuwe invoer
    openVerwijderWijzigPopup(progressieID: number) {
        this.isVerwijderMode = true;
        this.isLoading = false;
        this.isSaving = false;

        this.ophalen(progressieID).then ((p: HeliosBehaaldeProgressieDataset) => {
            this.competentie = this.competenties.find((c) => c.ID == p.COMPETENTIE_ID);

            if (!this.competentie) {
                console.error(this.competenties);
                this.competentieString = "<< onbekend >>";
                const errorString = "Competentie met ID " + p.COMPETENTIE_ID + " niet gevonden";
                this.error = {
                    beschrijving: errorString
                }
            }
            else {
                this.competentieString = this.vullenCompetentieString(this.competentie!.ID!);
            }
        })

        this.formTitel = "Aanpassen/verwijderen progressie voor " + this.lid.NAAM
        this.popup.open();
    }


    // maak een lange beschrijving van de competentie
    vullenCompetentieString(id: number, init = true) : string {
        if (init) {
            this.competentieString = "";
        }
        const competentie = this.competenties.find((c) => c.ID == id)

        if (!competentie) {
            return "";
        }

        let retValue = "";
        if (competentie.BLOK_ID) {
            retValue = this.vullenCompetentieString(competentie.BLOK_ID, false)
        }
        else {
            const t = this.topLevels.find((t) => t.ID == competentie.LEERFASE_ID)
            retValue = t!.OMSCHRIJVING!
        }
        retValue += (retValue != "") ? " - " : "";
        retValue += competentie.ONDERWERP;

        return retValue;
    }

    // uitvoeren van de actie waar we mee bezig zijn
    uitvoeren() {
        if (this.progressie.ID) {
            this.Aanpassen();
        } else {
            this.Toevoegen();
        }
    }

    // opslaan van de starts van een nieuwe dag rapport
    Toevoegen() {
        this.isSaving = true;
        this.progressieService.addProgressie(this.progressie).then((p) => {
            this.isSaving = false;
            this.success = {
                titel: "Progressie",
                beschrijving: "Competentie '" + this.competentie!.ONDERWERP  +"' behaald"
            }
            this.progressie = p;
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // bestaande dag rapport is aangepast.
    Aanpassen() {
        const ui = this.loginService.userInfo?.LidData;
        this.progressie.INSTRUCTEUR_ID =  ui?.ID;

        this.isSaving = true;
        this.progressieService.updateProgressie(this.progressie).then((p) => {
            this.isSaving = false;
            this.success = {
                titel: "Progressie",
                beschrijving: "Progressie is aangepast"
            }
            this.progressie = p;
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        });
    }

    // markeer een track als verwijderd
    Verwijderen() {
        this.isSaving = true;
        this.progressieService.deleteProgressie(this.progressie.ID!).then(() => {
            this.isSaving = false;
            this.success = {
                titel: "Progressie",
                beschrijving: "Progressie is verwijderd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // sluiten van window en inform parent dat data aangepast is.
    closePopup() {
        this.aangepast.emit(this.progressie.ID)
        this.popup.close();
    }

    // Datum van de start aanpassen
    datumAanpassen($datum: NgbDate) {
        this.geldigTot = DateTime.fromObject({year: $datum.year, month: $datum.month, day: $datum.day});
        this.progressie.GELDIG_TOT = this.geldigTot.toISODate() as string;
    }
}
