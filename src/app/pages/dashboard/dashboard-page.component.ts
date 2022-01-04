import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
import {Subscription} from "rxjs";
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
export class DashboardPageComponent implements OnInit, OnDestroy {
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

    private typesAbonnement: Subscription;
    lidTypes: HeliosType[] = [];
    statusTypes: HeliosType[] = [];
    lidData: HeliosLid;

    private datumAbonnement: Subscription; // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag

    toonTracks: boolean = false;           // mogen de tracks vertoon worden
    isDDWVer: boolean = false;             // DDWV'ers hebben een aangepast dashboard

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    @ViewChild('logboekPopup') private popupLogboek: ModalComponent;
    @ViewChild('dienstenPopup') private popupDiensten: ModalComponent;
    @ViewChild(StartEditorComponent) private startEditor: StartEditorComponent;

    verwijderMode: boolean = false;
    magVerwijderen: boolean = false;

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

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.lidTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 6});          // lidtypes
            this.statusTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 19});      // status types (DBO, solo, brevet)```````
        });

        // Als lidID is meegegeven in URL, moeten we de lidData ophalen
        this.activatedRoute.queryParams.subscribe(params => {
            if (params['lidID']) {
                const lidID = params['lidID'];
                this.ledenService.getLid(lidID).then((l) => {
                    this.lidData = l
                    this.isDDWVer = (this.lidData.LIDTYPE_ID == 625);
                });
            } else {
                this.lidData = this.loginService.userInfo?.LidData as HeliosLid;
                this.isDDWVer = (this.loginService.userInfo?.Userinfo?.isDDWV!);
            }
        });

        const ui = this.loginService.userInfo?.Userinfo;

        if (ui?.isStarttoren) {
            this.router.navigate(['vluchten']);
        }

        this.toonTracks = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT || ui?.isInstructeur) ? true : false;
    }

    ngOnDestroy(): void {
        if (this.datumAbonnement)  this.datumAbonnement.unsubscribe();
        if (this.typesAbonnement)  this.typesAbonnement.unsubscribe();
    }

    // Met welk lidmaatschap hebben te maken, geef de omschrijving
    getLidType(): string {
        const t = this.lidTypes.find(type => type.ID == this.lidData.LIDTYPE_ID) as HeliosType;
        if (t) {
            return t.OMSCHRIJVING!;
        }
        return "";
    }

    // Welke vlieg status heeft dit lid
    getStatusType(): string {
        const t = this.statusTypes.find(type => type.ID == this.lidData.STATUSTYPE_ID) as HeliosType;
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

    // mogen we vlieger status aanpassen
    statusWijzigbaar(): boolean {
        const ui = this.loginService.userInfo?.Userinfo;
        return (ui?.isBeheerder! || ui?.isCIMT!);
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

    // aanpassen van de vliegstatus in lid record
    wijzigVliegStatus() {
        const upd: HeliosLid = {ID: this.lidData.ID, STATUSTYPE_ID: this.lidData.STATUSTYPE_ID}

        this.ledenService.updateLid(upd).then((l) => {
            this.error = undefined;

            const ui = this.loginService.userInfo?.LidData
            if (l.ID == ui!.ID) {
                this.success = {titel: "Profiel", beschrijving: "Uw vliegstatus is aangepast"}
            }
            else {
                this.success = {titel: "Profiel", beschrijving: "Vliegstatus van " + l.NAAM + " is aangepast"}
            }
        }).catch(e => {
            this.success = undefined;
            this.error = e;
        });
    }
}
