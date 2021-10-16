import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {
    HeliosBehaaldeProgressieDataset,
    HeliosCompetentiesDataset,
} from "../../../types/Helios";
import {ErrorMessage, HeliosActie, SuccessMessage} from "../../../types/Utils";
import {SharedService} from "../../../services/shared/shared.service";
import {LoginService} from "../../../services/apiservice/login.service";
import {CompetentieService} from "../../../services/apiservice/competentie.service";
import {Subscription} from "rxjs";
import {ModalComponent} from "../modal/modal.component";

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.scss']
})

export class StatusComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;
    @ViewChild(ModalComponent) private bevestigPopup: ModalComponent;

    cheks: any;
    overig: any;
    gehaaldeProgressie: HeliosBehaaldeProgressieDataset[];
    competentiesAbonnement: Subscription;
    competenties: HeliosCompetentiesDataset[];
    suspend: boolean = false;
    isLoading: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    bevestigCompetentie: HeliosCompetentiesDataset | undefined;
    checkboxSelected: any;

    constructor(private readonly loginService: LoginService,
                private readonly configService: PegasusConfigService,
                private readonly sharedService: SharedService,
                private readonly competentieService: CompetentieService,
                private readonly progressieService: ProgressieService) {

        // Als in de progressie tabel is aangepast, moet we onze dataset ook aanpassen
        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Progressie") {
                if (!this.suspend && (ev.actie == HeliosActie.Add || ev.actie == HeliosActie.Delete)) {
                    this.ophalen();
                }
            }
        });

        // abonneer op wijziging van competenties
        this.competentiesAbonnement = this.competentieService.competentiesChange.subscribe(dataset => {
            this.competenties = dataset!;
        });
    }

    ngOnInit(): void {
        this.cheks = this.configService.getChecks();
        this.overig = this.configService.getOverig();
        this.ophalen();
    }

    ophalen(): void {
        if (!this.cheks) // er zijn nog geen Checks
            return;

        // maak CSV string met de competentie IDs van de checks en overig
        let comptentieIDs = "";

        // checks
        comptentieIDs += this.cheks.Check.map((p: any) => {
            return p.CompetentieID.join(',');
        }).join(',');

        comptentieIDs += ',';
        comptentieIDs += this.overig.map((p: any) => {
            return p.CompetentieID;
        }).join(',');

        this.isLoading = true;
        this.progressieService.getProgressie(this.VliegerID, comptentieIDs).then((p) => {
            this.isLoading = false;
            this.gehaaldeProgressie = p
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });
    }

    CheckGehaald(comptentieID: number): boolean {
        if (!this.gehaaldeProgressie) return false;

        if (this.gehaaldeProgressie.findIndex((p) => p.COMPETENTIE_ID == comptentieID) < 0) {
            return false;
        } else {
            return true;
        }
    }

    CheckDisabled(comptentieID: number): boolean {
        const ui = this.loginService.userInfo?.Userinfo;
        if (!ui?.isBeheerder && !ui?.isInstructeur && !ui?.isCIMT) {
            return true;    // alleen beheerder, instructeuers en CIMT mogen competentie zetten
        }

        if (!this.gehaaldeProgressie) return false;

        if (this.gehaaldeProgressie.findIndex((p) => p.COMPETENTIE_ID == comptentieID) >= 0) {
            return true;
        }
        return false;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.ophalen()
        }
    }

    // Zorg ervoor dat we niet gaan laden
    uitstellen(): void {
        this.suspend = true;
        setTimeout(() => this.suspend = false, 1000);
    }


    // Progressie kan gezet worden via snelkeuze in deze component, lange weg kan via progressie boom
    zetProgressie(e:any, id:number) {
        this.bevestigCompetentie = this.competenties.find((c) => c.ID == id);
        this.checkboxSelected = e;

        this.bevestigPopup.open();
    }

    updateProgressie()
    {
        try {
            const ui = this.loginService.userInfo?.LidData;
            this.progressieService.behaaldeCompetentie({
                    LID_ID: this.VliegerID,
                    INSTRUCTEUR_ID: ui?.ID,
                    COMPETENTIE_ID: this.bevestigCompetentie?.ID,
                }).then((p) => {
                this.checkboxSelected.target.disabled = true;       // mogen check niet weghalen, dus disable de checkbox
                    this.success =
                    {
                        titel: "Progressie",
                        beschrijving: "Competentie '" + this.bevestigCompetentie!.ONDERWERP  +"' behaald"
                    }
                    this.bevestigCompetentie = undefined;
                    this.bevestigPopup.close();
                });

            this.uitstellen();      // we hebben het vinkje in deze component gezet, we hoeven niet te laden
        }
        catch (e) {
            this.error = e;
        }

    }
}
