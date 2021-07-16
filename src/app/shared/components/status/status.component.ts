import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {HeliosProgressieDataset} from "../../../types/Helios";

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;

    cheks: any;
    overig: any;
    gehaaldeProgressie: HeliosProgressieDataset[];

    constructor(private readonly configService: PegasusConfigService,
                private readonly progressieService: ProgressieService) {
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
}
