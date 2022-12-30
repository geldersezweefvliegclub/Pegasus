import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {HeliosLogboekDataset, HeliosStartDataset} from "../../../types/Helios";
import {LoginService} from "../../../services/apiservice/login.service";
import {TijdInvoerComponent} from "../editors/tijd-invoer/tijd-invoer.component";
import {TrackEditorComponent} from "../editors/track-editor/track-editor.component";
import {StartEditorComponent} from "../editors/start-editor/start-editor.component";
import {DateTime, Interval} from "luxon";
import {SharedService} from "../../../services/shared/shared.service";
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";

@Component({
    selector: 'app-vlucht-card',
    templateUrl: './vlucht-card.component.html',
    styleUrls: ['./vlucht-card.component.scss']
})
export class VluchtCardComponent implements OnInit {
    @Input() logboek: HeliosLogboekDataset;
    @Input() start: HeliosStartDataset;

    @ViewChild(TijdInvoerComponent) tijdInvoerEditor: TijdInvoerComponent;
    @ViewChild(TrackEditorComponent) trackEditor: TrackEditorComponent;
    @ViewChild(StartEditorComponent) startEditor: StartEditorComponent;

    inTijdspan: boolean = false;
    datumDM: string;

    constructor(private readonly configService: PegasusConfigService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        if (!this.start) {
            this.start = JSON.parse(JSON.stringify(this.logboek));    // alles harmoniseren naar start object

            // mismatch start & logboek oplossen, in logboek zijn VLIEGERNAAM en INZITTENDENAAM altijd ingevuld
            // bij een start zijn de namen VLIEGERNAAM_LID en INZITTENDENAAM_LID
            // VLIEGERNAAM en INZITTENDENAAM  worden gebruikt voor handmatig naam invoer
            this.start.VLIEGERNAAM_LID = this.logboek.VLIEGERNAAM;
            this.start.VLIEGERNAAM = undefined;
            this.start.INZITTENDENAAM_LID = this.logboek.INZITTENDENAAM;
            this.start.INZITTENDENAAM = undefined
        }

        const ui = this.loginService.userInfo;
        const nu: DateTime = DateTime.now()

        const diff = Interval.fromDateTimes(DateTime.fromSQL(this.start.DATUM!), nu);
        if (diff.length("days") > this.configService.maxZelfEditDagen()) {
            this.inTijdspan = ui!.Userinfo!.isBeheerder!;   // alleen beheerder mag na xx dagen wijzigen. xx is geconfigureerd in pegasus.config
        } else {
            this.inTijdspan = true; // zitten nog binnen de termijn
        }
        this.datumDM = this.sharedService.datumDM(this.start.DATUM!)    // jaar hoeft niet getoond te worden
    }

    // Moeten we link tonen naar dashboard
    naarDashboard(vlieger: boolean): boolean {
        const ui = this.loginService.userInfo;

        if (vlieger) {
            if (this.start.VLIEGER_ID == undefined || this.start.VLIEGER_ID == ui!.LidData?.ID) {
                return false;
            }
            if (this.start.VLIEGERNAAM) {
                return false;
            }
        }
        else {
            if (this.start.INZITTENDE_ID == undefined || this.start.INZITTENDE_ID == ui!.LidData?.ID) {
                return false;
            }
            if (this.start.INZITTENDENAAM) {
                return false;
            }
        }
        return (ui!.Userinfo!.isBeheerder || ui!.Userinfo!.isCIMT || ui!.Userinfo!.isInstructeur) as boolean;
    }

    // openen van popup om bestaande start te kunnen aanpassen
    openStartEditor() {
        if (this.inTijdspan) {
            this.startEditor.openPopup(this.start);
        }
    }

    // bestaande starttijd wijzigen door openen van starttijd popup
    startTijdClicked() {
        this.tijdInvoerEditor.openStarttijdPopup(this.start);
    }

    // bestaande landingstijd wijzigen door openen van de landingstijd popup
    landingsTijdClicked() {
        this.tijdInvoerEditor.openLandingsTijdPopup(this.start);
    }
}
