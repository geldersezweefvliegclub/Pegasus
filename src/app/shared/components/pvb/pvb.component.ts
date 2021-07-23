import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {HeliosBehaaldeProgressieDataset} from "../../../types/Helios";
import {Subject} from "rxjs";
import {HeliosActie, HeliosEvent} from "../../../types/Utils";
import {SharedService} from "../../../services/shared/shared.service";
import {LoginService} from "../../../services/apiservice/login.service";

@Component({
    selector: 'app-pvb',
    templateUrl: './pvb.component.html',
    styleUrls: ['./pvb.component.scss']
})
export class PvbComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;
    PVBs: any[];
    gehaaldeProgressie: HeliosBehaaldeProgressieDataset[]
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
        this.PVBs = this.configService.getPVB();
        this.ophalen();
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

