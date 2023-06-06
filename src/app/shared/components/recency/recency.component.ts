import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {HeliosBehaaldeProgressieDataset, HeliosLid, HeliosRecency} from "../../../types/Helios";
import {RecencyGrafiekComponent} from "./recency-grafiek/recency-grafiek.component";
import {ErrorMessage, SuccessMessage} from "../../../types/Utils";
import {InstructieGrafiekComponent} from "./instructie-grafiek/instructie-grafiek.component";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faCircleCheck, faCircleXmark, faEnvelope} from "@fortawesome/free-solid-svg-icons";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {DateTime} from "luxon";
import {StartGrafiekComponent} from "./start-grafiek/start-grafiek.component";

// is EASA brevet geldig,
// -1 = niet van toepasssing
// 0 = niet geldig
// 1 = geldig
type brevetEASA = {
    aantal: boolean;
    medical: boolean;

    lierstarts: number;
    sleepstart: number;
    zelfstarts: number;
    tmgstarts: number;
    pax: number;
};

@Component({
    selector: 'app-recency',
    templateUrl: './recency.component.html',
    styleUrls: ['./recency.component.scss']
})

export class RecencyComponent implements OnInit, OnChanges {
    @Input() Vlieger: HeliosLid;
    @Input() naam: string;

    @ViewChild(RecencyGrafiekComponent) private grafiekRecency: RecencyGrafiekComponent;
    @ViewChild(InstructieGrafiekComponent) private grafiekInstructie: InstructieGrafiekComponent;
    @ViewChild(StartGrafiekComponent) private grafiekStarts: StartGrafiekComponent;

    checkIcon: IconDefinition = faCircleCheck;
    declineIcon: IconDefinition = faCircleXmark;

    aantekeningen: HeliosBehaaldeProgressieDataset[];

    recency: HeliosRecency;
    isLoading: boolean = false;
    toonEASA: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    brevet: brevetEASA = {
        aantal: false,
        medical: false,
        lierstarts: -1,
        sleepstart: -1,
        zelfstarts: -1,
        tmgstarts: -1,
        pax: -1
    };

    constructor(private readonly startlijstService: StartlijstService,
                private readonly progressieService: ProgressieService) {
    }

    ngOnInit(): void {
        this.ophalen();
    }

    ophalen(): void {
        this.isLoading = true;

        // Welke aantekingen heeft vlieger (lees competenties)
        // 271 = Passagiers vliegen
        // 272 = Lieren
        // 273 = Slepen
        // 274 = Zelfstart

        this.progressieService.getProgressiesLid(this.Vlieger.ID!, "271,272,273,274").then((p:HeliosBehaaldeProgressieDataset[]) => {
            this.aantekeningen = p;

            this.brevet.lierstarts = -1;
            this.brevet.zelfstarts = -1;
            this.brevet.sleepstart = -1;
            this.brevet.tmgstarts =-1;
            this.brevet.medical = false;

            this.startlijstService.getRecency(this.Vlieger.ID!).then((r) => {
                this.isLoading = false;
                this.recency = r

                if (this.aantekeningen.findIndex (a => a.COMPETENTIE_ID === 271) >= 0) {
                    this.brevet.pax = (r.STARTS_DRIE_MND! >= 3) ? 1 : 0;
                }
                else {
                    this.brevet.pax = -1;
                }

                if (r.LIERSTARTS! > 5) {
                    this.brevet.lierstarts = 1;
                }
                else if (this.aantekeningen.findIndex (a => a.COMPETENTIE_ID === 272) >= 0) {
                    this.brevet.lierstarts = 0;
                }

                if (r.SLEEPSTARTS! > 5) {
                    this.brevet.sleepstart = 1;
                }
                else if (this.aantekeningen.findIndex (a => a.COMPETENTIE_ID === 273) >= 0) {
                    this.brevet.sleepstart = 0;
                }

                if (r.ZELFSTARTS! > 5) {
                    this.brevet.zelfstarts = 1;
                }
                else if (this.aantekeningen.findIndex (a => a.COMPETENTIE_ID === 274) >= 0) {
                    this.brevet.zelfstarts = 0;
                }
                if (r.TMGSTARTS! > 5) {
                    this.brevet.tmgstarts = 1;
                }

                this.brevet.aantal = ((r.STARTS_24_MND! >= 15) && (parseInt(r.UREN_24_MND!.split(":")[0]) > 5));

                if (this.Vlieger.MEDICAL) {
                    const nu: DateTime = DateTime.now();
                    const d: DateTime = DateTime.fromSQL(this.Vlieger.MEDICAL);

                    console.log(this.Vlieger)
                    this.brevet.medical =  (d > nu); // datum is in het toekomst
                }
            }).catch(e => {
                this.error = e;
                this.isLoading = false;
            });
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.ophalen()
        }
    }

    openRecencyPopup(): void {
        this.grafiekRecency.openPopup();
    }

    openInstructiePopup(): void {
        this.grafiekInstructie.openPopup();
    }

    openStartPopup() {
        this.grafiekStarts.openPopup();
    }

    geenGeldigBrevet() {
        return ((this.brevet.aantal === false) ||
            (this.brevet.medical === false) ||
            (this.brevet.lierstarts === 0) ||
            (this.brevet.sleepstart === 0) ||
            (this.brevet.zelfstarts === 0) ||
            (this.brevet.pax === 0))
     }
}

