import {Component, OnInit, ViewChild} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {
    faBookmark, faAddressCard, faCalendarAlt, faChartLine, faChartPie,
    faClipboardList, faExternalLinkSquareAlt, faPlane,
    faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../services/apiservice/login.service";
import {HeliosLid, HeliosType} from "../../types/Helios";
import {ActivatedRoute, Router} from "@angular/router";
import {LedenService} from "../../services/apiservice/leden.service";
import {TypesService} from "../../services/apiservice/types.service";
import {faAvianex} from "@fortawesome/free-brands-svg-icons";
import {ModalComponent} from "../../shared/components/modal/modal.component";
import {of, Subscription} from "rxjs";
import {DateTime} from "luxon";
import {SharedService} from "../../services/shared/shared.service";
import * as xlsx from "xlsx";
import {StartlijstService} from "../../services/apiservice/startlijst.service";
import {ProgressieService} from "../../services/apiservice/progressie.service";
import {ErrorMessage, SuccessMessage} from "../../types/Utils";
import {StartEditorComponent} from "../../shared/components/editors/start-editor/start-editor.component";

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard-page.component.html',
    styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
    private iconCardIcon: IconDefinition = faChartPie;
    private iconProgressie: IconDefinition = faChartLine;
    private iconLogboek: IconDefinition = faClipboardList;
    private iconRooster: IconDefinition = faCalendarAlt;
    private iconRecency: IconDefinition = faTachometerAlt;
    private iconPVB: IconDefinition = faAvianex;
    private iconStatus: IconDefinition = faBookmark;
    private iconExpand: IconDefinition = faExternalLinkSquareAlt;
    private iconPlane: IconDefinition = faPlane;
    private iconTracks: IconDefinition = faAddressCard;

    private typesAbonnement: Subscription;
    private lidTypes: HeliosType[] = [];
    private lidData: HeliosLid;

    private datumAbonnement: Subscription;         // volg de keuze van de kalender
    private datum: DateTime;                       // de gekozen dag

    private toonTracks: boolean = false;           // mogen de tracks vertoon worden

    private success: SuccessMessage | undefined;
    private error: ErrorMessage | undefined;

    @ViewChild('logboekPopup') private popupLogboek: ModalComponent;
    @ViewChild('dienstenPopup') private popupDiensten: ModalComponent;
    @ViewChild(StartEditorComponent) private startEditor: StartEditorComponent;

    verwijderMode: boolean = false;

    constructor(private readonly ledenService: LedenService,
                private readonly loginService: LoginService,
                private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly startlijstService: StartlijstService,
                private readonly progressieService: ProgressieService,
                private readonly router: Router,
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

        // abonneer op wijziging van types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.lidTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 6});    // lidtypes
        });

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

        if (ui?.isStarttoren) {
            this.router.navigate(['startlijst']);
        }
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


    // Toevoegen van een start
    addStart() {
        this.startEditor.openPopup(null);
    }

    // export het vlieger logboek naar excel
    exportLogboek() {
        if (this.lidData.ID) {
            const startDatum: DateTime = DateTime.fromObject( {year: this.datum.year, month: 1, day: 1});
            const eindDatum: DateTime = DateTime.fromObject( {year: this.datum.year, month: 12, day: 31});

            this.startlijstService.getLogboek(this.lidData.ID, startDatum, eindDatum).then((dataset) => {
                // Datum in juiste formaat zetten
                dataset.forEach((start) => {
                    const d = DateTime.fromSQL(start.DATUM!);
                    start.DATUM = d.day + "-" + d.month + "-" + d.year
                })

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
