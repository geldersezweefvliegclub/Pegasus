import {Component} from '@angular/core';
import {faAddressCard} from "@fortawesome/free-solid-svg-icons";
import {AgRendererComponent} from "ag-grid-angular";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {ICellRendererParams} from "ag-grid-community";
import {LoginService} from "../../../../services/apiservice/login.service";

@Component({
    selector: 'app-track-render',
    templateUrl: './track-render.component.html',
    styleUrls: ['./track-render.component.scss']
})
export class TrackRenderComponent implements AgRendererComponent {
    private params: any;
    trackIcon: IconDefinition = faAddressCard;

    LID_ID: number;
    NAAM: string;

    constructor(private readonly loginService: LoginService) {
    }

    agInit(params: ICellRendererParams): void {
        this.params = params;

        this.LID_ID = -1;

        const ui = this.loginService.userInfo?.LidData;
        if (this.params.data.INZITTENDE_ID) {
            if (ui?.ID !== this.params.data.INZITTENDE_ID) {
                this.LID_ID = params.data.INZITTENDE_ID;
                this.NAAM = params.data.INZITTENDENAAM;
            }
        }
        if (ui?.ID !== this.params.data.VLIEGER_ID) {
            this.LID_ID = params.data.VLIEGER_ID;
            this.NAAM = params.data.VLIEGERNAAM;
        }
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }

    buttonClicked() {
        const startID = this.params.data.ID;

        // datum naar dd-mm-yyyy
        const datum = this.params.data.DATUM.split('-')[2] + "-" + this.params.data.DATUM.split('-')[1] + "-" + this.params.data.DATUM.split('-')[0];

        let tekst = "Betreft: Een #STARTMETHODE# met de #REG_CALL# op #DATUM# om #STARTTIJD# met een duur van #DUUR# (hh:mm) \n\n";
        tekst = tekst.replace(/#STARTMETHODE#/, (this.params.data.STARTMETHODE) ? this.params.data.STARTMETHODE : "start");
        tekst = tekst.replace(/#REG_CALL#/, this.params.data.REG_CALL);
        tekst = tekst.replace(/#DATUM#/, datum);
        tekst = tekst.replace(/#STARTTIJD#/, this.params.data.STARTTIJD);
        tekst = tekst.replace(/#DUUR#/, this.params.data.DUUR);

        this.params.onTrackClicked(this.LID_ID, startID, this.NAAM, tekst);
    }
}
