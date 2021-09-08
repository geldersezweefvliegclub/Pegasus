import {Component, OnInit, ViewChild} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {
    faBookmark, faAddressCard, faCalendarAlt, faChartLine, faChartPie,
    faClipboardList, faExternalLinkSquareAlt, faPlane,
    faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../services/apiservice/login.service";
import {HeliosLid, HeliosType} from "../../types/Helios";
import {ActivatedRoute} from "@angular/router";
import {LedenService} from "../../services/apiservice/leden.service";
import {TypesService} from "../../services/apiservice/types.service";
import {faAvianex} from "@fortawesome/free-brands-svg-icons";
import {ModalComponent} from "../../shared/components/modal/modal.component";
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {SharedService} from "../../services/shared/shared.service";
import * as xlsx from "xlsx";
import {StartlijstService} from "../../services/apiservice/startlijst.service";
import {ProgressieService} from "../../services/apiservice/progressie.service";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard-page.component.html',
    styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
    iconCardIcon: IconDefinition = faChartPie;
    iconProgressie: IconDefinition = faChartLine;
    iconLogboek: IconDefinition = faClipboardList;
    iconRooster: IconDefinition = faCalendarAlt;
    iconRecency: IconDefinition = faTachometerAlt;
    iconPVB: IconDefinition = faAvianex;
    iconStatus: IconDefinition = faBookmark;
    iconExpand: IconDefinition = faExternalLinkSquareAlt;
    iconPlane: IconDefinition = faPlane;
    iconTracks: IconDefinition = faAddressCard;

    lidTypes: HeliosType[] = [];
    lidData: HeliosLid;

    datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag

    toonTracks: boolean = false;           // mogen de tracks vertoon worden

    @ViewChild('logboekPopup') private popupLogboek: ModalComponent;
    @ViewChild('dienstenPopup') private popupDiensten: ModalComponent;

    constructor(private readonly ledenService: LedenService,
                private readonly loginService: LoginService,
                private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly startlijstService: StartlijstService,
                private readonly progressieService: ProgressieService,
                private activatedRoute: ActivatedRoute) {
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })
        })

        this.typesService.getTypes(6).then(types => this.lidTypes = types); // ophalen lidtypes

        // Als lidID is meegegeven in URL, moeten we de lidData ophalen
        this.activatedRoute.queryParams.subscribe(params => {
            if (params['lidID']) {
                const lidID = params['lidID'];
                this.ledenService.getLid(lidID).then((l) => this.lidData = l);
            } else {
                this.lidData = this.loginService.userInfo?.LidData as HeliosLid;
            }
        });

        const ui = this.loginService.userInfo?.Userinfo;
        this.toonTracks = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;
    }

    // Met welk lidmaatschap hebben te maken, geef de omschrijving
    getLidType(): string {
        const t = this.lidTypes.find(type => type.ID == this.lidData.LIDTYPE_ID) as HeliosType;
        if (t) {
            return t.OMSCHRIJVING!;
        }
        return "";
    }

    // laat meer vluchten zien van logboek in een popupLogboek window
    toonLogboekGroot(): void {
        this.popupLogboek.open();
    }

    toonDienstenGroot() {
        this.popupDiensten.open();
    }

    // export het vlieger logboek naar excel
    exportLogboek() {
        if (this.lidData.ID) {
            const startDatum: DateTime = DateTime.fromObject( {year: this.datum.year, month: 1, day: 1});
            const eindDatum: DateTime = DateTime.fromObject( {year: this.datum.year, month: 12, day: 31});

            this.startlijstService.getLogboek(this.lidData.ID, startDatum, eindDatum).then((dataset) => {
                let ws = xlsx.utils.json_to_sheet(dataset);
                const wb: xlsx.WorkBook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
                xlsx.writeFile(wb, 'logboek ' + this.datum.year.toString() + '-' + new Date().toJSON().slice(0, 10) + '.xlsx');
            });
        }
    }

    // export de comptentiekaart naar excel
    exportProgressieKaart() {
        if (this.lidData.ID) {
            this.progressieService.getProgressieKaart(this.lidData.ID).then((dataset) => {

                // velden die voor de gebruiker nutteloos zijn, halen we weg
                for (let i=0; i< dataset.length ; i++) {
                    dataset[i].ID = undefined;
                    dataset[i].LEERFASE_ID = undefined;
                    dataset[i].BLOK_ID = undefined;
                    dataset[i].PROGRESSIE_ID = undefined;
                }
                let ws = xlsx.utils.json_to_sheet(dataset);
                const wb: xlsx.WorkBook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
                xlsx.writeFile(wb, 'progressiekaart ' + this.lidData.NAAM + '-' + new Date().toJSON().slice(0, 10) + '.xlsx');
            });
        }
    }
}
