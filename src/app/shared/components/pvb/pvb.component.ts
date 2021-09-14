import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {HeliosBehaaldeProgressieDataset, HeliosCompetentiesDataset} from "../../../types/Helios";
import {ErrorMessage, HeliosActie, SuccessMessage} from "../../../types/Utils";
import {SharedService} from "../../../services/shared/shared.service";
import {LoginService} from "../../../services/apiservice/login.service";
import {CompetentieService} from "../../../services/apiservice/competentie.service";

@Component({
    selector: 'app-pvb',
    templateUrl: './pvb.component.html',
    styleUrls: ['./pvb.component.scss']
})
export class PvbComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;

    PVBs: any[];
    gehaaldeProgressie: HeliosBehaaldeProgressieDataset[];
    competenties: HeliosCompetentiesDataset[];
    suspend: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

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
    }

    ngOnInit(): void {
        this.PVBs = this.configService.getPVB();
        this.competentieService.getCompetenties().then((competenties) => this.competenties = competenties)
        this.ophalen();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.ophalen()
        }
    }

    ophalen(): void {
        if (!this.PVBs) // er zijn nog geen PVB
            return;

        // maak CSV string met de competentie IDs van de PVBs
        const comptentieIDs = this.PVBs.map((p: any) => {
            return p.Lokaal + "," + p.Overland;
        }).join(',');

        this.progressieService.getProgressie(this.VliegerID, comptentieIDs).then((p) => this.gehaaldeProgressie = p);
    }

    PVBgehaald(comptentieID: number): boolean {

        if (!this.gehaaldeProgressie) return false;

        if (this.gehaaldeProgressie.findIndex((p) => p.COMPETENTIE_ID == comptentieID) >= 0) {
            return true;
        }
        return false;
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

    // Zorg ervoor dat we niet gaan laden
    uitstellen(): void {
        this.suspend = true;
        setTimeout(() => this.suspend = false, 1000);
    }

    // Progressie kan gezet worden via snelkeuze in deze component, lange weg kan via progressie boom
    zetProgressie(e:any, id:number) {
        try {


            e.target.disabled = true;       // mogen check niet weghalen, dus disable de checkbox

            const ui = this.loginService.userInfo?.LidData;
            this.progressieService.behaaldeCompetentie({
                LID_ID: this.VliegerID,
                INSTRUCTEUR_ID: ui?.ID,
                COMPETENTIE_ID: id,
            }).then((p) => {
                e.target.disabled = true;       // mogen check niet weghalen, dus disable de checkbox
                const c = this.competenties.find((c) => c.ID == p.COMPETENTIE_ID);

                this.success =
                {
                    titel: "Progressie",
                    beschrijving: "Competentie '" + c!.ONDERWERP  +"' behaald"
                }
            });


            this.uitstellen();      // we hebben het vinkje in deze component gezet, we hoeven niet te laden
        }
        catch (e) {
            this.error = e;
        }
    }
}

