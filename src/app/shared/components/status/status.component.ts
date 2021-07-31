import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {HeliosBehaaldeProgressieDataset} from "../../../types/Helios";
import {HeliosActie} from "../../../types/Utils";
import {SharedService} from "../../../services/shared/shared.service";
import {LoginService} from "../../../services/apiservice/login.service";

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;

    cheks: any;
    overig: any;
    gehaaldeProgressie: HeliosBehaaldeProgressieDataset[];
    suspend: boolean = false;

    constructor(private readonly loginService: LoginService,
                private readonly configService: PegasusConfigService,
                private readonly sharedService: SharedService,
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

        this.progressieService.getProgressie(this.VliegerID, comptentieIDs).then((p) => this.gehaaldeProgressie = p);
    }

    CheckGehaald(comptentieID: number): boolean {
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
        e.target.disabled = true;       // mogen check niet weghalen, dus disable de checkbox

        const ui = this.loginService.userInfo?.LidData;
        this.progressieService.behaaldeCompetentie({
            LID_ID: this.VliegerID,
            INSTRUCTEUR_ID: ui?.ID,
            COMPETENTIE_ID: id,
        });

        this.uitstellen();      // we hebben het vinkje in deze component gezet, we hoeven niet te laden
    }
}
