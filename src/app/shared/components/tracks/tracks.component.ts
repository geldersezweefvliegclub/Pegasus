import {Component, HostListener, Input, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {HeliosLedenDataset, HeliosTrack, HeliosTracksDataset} from "../../../types/Helios";
import {TracksService} from "../../../services/apiservice/tracks.service";
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {TrackEditorComponent} from "../editors/track-editor/track-editor.component";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {
    faAddressCard,
    faBookmark,
    faMinusCircle,
    faPlane,
    faRecycle,
    faTachometerAlt,
    faUndo
} from "@fortawesome/free-solid-svg-icons";
import {ErrorMessage, SuccessMessage} from "../../../types/Utils";
import {LedenService} from "../../../services/apiservice/leden.service";
import {LoginService} from "../../../services/apiservice/login.service";
import {faAvianex} from "@fortawesome/free-brands-svg-icons";
import {DateTime} from "luxon";
import {Subscription} from "rxjs";

export interface TracksLedenDataset extends HeliosTracksDataset {
    lid: HeliosLedenDataset;
}

@Component({
    selector: 'app-tracks',
    templateUrl: './tracks.component.html',
    styleUrls: ['./tracks.component.scss']
})
export class TracksComponent implements OnInit, OnDestroy {
    @Input() VliegerID: number;
    @Input() VliegerNaam: string;
    @Input() toonLid: boolean = false;

    @ViewChild(TrackEditorComponent) trackEditor: TrackEditorComponent;

    iconCardIcon: IconDefinition = faAddressCard;
    prullenbakIcon: IconDefinition = faRecycle;
    iconRecency: IconDefinition = faTachometerAlt;
    iconPVB: IconDefinition = faAvianex;
    iconStatus: IconDefinition = faBookmark;
    iconPlane: IconDefinition = faPlane;
    deleteIcon: IconDefinition = faMinusCircle;
    restoreIcon: IconDefinition = faUndo;

    private dbEventAbonnement: Subscription;
    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];
    data: TracksLedenDataset[] = [];

    private datumAbonnement: Subscription; // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om data ophalen te beperken
    deleteMode: boolean = false;        // zitten we in delete mode om vliegtuigen te kunnen verwijderen
    trashMode: boolean = false;         // zitten in restore mode om vliegtuigen te kunnen terughalen
    isLoading: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    magToevoegen: boolean = true;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;

    geselecteerdLid: number;
    Naam: string;

    constructor(private readonly trackService: TracksService,
                private readonly ledenService: LedenService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isCIMT) ? true : false;

        // Alleen als we onderstaande rollen hebben kunnen we Tracks gebruiken
        if (ui?.isCIMT || ui?.isInstructeur || ui?.isBeheerder) {
            // de datum zoals die in de kalender gekozen is
            this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1
                })
            });

            // abonneer op wijziging van leden
            this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
                this.leden = (leden) ? leden : [];
                this.lidToevoegenAanTrack();
            });

            /* TODO WAAROM IS DIT NODIG ??
            // Als tracks zijn aangepast, moeten we grid opnieuw laden
            this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
                if (ev.tabel == "Startlijst") {
                    this.opvragen();
                }
            });

             */

            // Als in de tracks tabel is aangepast, moet we onze dataset ook aanpassen
            this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
                if (ev.tabel == "Tracks") {
                    if (!this.VliegerID) {
                        this.opvragen();
                    } else if (ev.data.LID_ID == this.VliegerID) {
                        this.opvragen();
                    }
                }
            });

            this.opvragen();
        }
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)   this.dbEventAbonnement.unsubscribe();
        if (this.datumAbonnement)     this.datumAbonnement.unsubscribe();
        if (this.datumAbonnement)     this.datumAbonnement.unsubscribe();
    }

    // open de track editor om nieuwe track toe te voegen. Editor opent als popup
    openTrackEditor() {
        this.trackEditor.openPopup(null, this.VliegerID, undefined, this.VliegerNaam);
    }

    // open de track editor om nieuwe track toe te voegen. Editor opent als popup
    replyTrackEditor(trk: TracksLedenDataset) {
        const tekst = "In reactie op: \n----------------\n" + trk.TEKST + "\n----------------\n";
        this.trackEditor.openPopup(null, trk.LID_ID, undefined, trk.LID_NAAM, tekst);
    }

    // Toevoegen van een vlieger track aan de database
    ToevoegenTrack(track: HeliosTrack): void {
        this.trackService.addTrack(track);
        this.trackEditor.closePopup();
    }

    // openen van popup om gegevens van een bestaande track aan te passen
    openEditor(trk: TracksLedenDataset) {
        const ui = this.loginService.userInfo?.LidData;

        // Je mag alleen tracks van jezelf wijzigen
        if ((trk.INSTRUCTEUR_ID == ui!.ID) || (this.magWijzigen)) {
            this.trackEditor.openPopup(trk, trk.LID_ID, undefined, trk.LID_NAAM as string);
        }
        else {
            window.alert("U bent niet gemachtigd om deze track aan te passen");
        }
    }

    // openen van popup om track te verwijderen
    openVerwijderPopup(trk: TracksLedenDataset) {
        this.trackEditor.openVerwijderPopup(trk.ID as number, trk.LID_NAAM as string);
    }

    // openen van popup om track te hestellen
    openRestorePopup(trk: TracksLedenDataset) {
        this.trackEditor.openRestorePopup(trk.ID as number, trk.LID_NAAM as string);
    }

    // schakelen tussen deleteMode JA/NEE. In deleteMode kun je vliegtuigen verwijderen
    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde vliegtuigen getoond
    trashModeJaNee() {
        this.opvragen();
    }

    // Opvragen van de data via de api
    opvragen(): void {
        clearTimeout(this.zoekTimer);

        const maxTrackItems = (this.VliegerID) ? -1 : 100; // alle tracks voor een vlieger, anders 100 items

        this.zoekTimer = window.setTimeout(() => {
            this.isLoading = true;
            this.trackService.getTracks(this.trashMode, this.VliegerID, maxTrackItems).then((dataset) => {
                this.isLoading = false;
                this.data = dataset as TracksLedenDataset[];
                this.lidToevoegenAanTrack();
            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        }, 400);
    }

    lidToevoegenAanTrack() {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i].lid = this.leden.find(l => l.ID == this.data[i].LID_ID) as HeliosLedenDataset;
        }
    }


    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.opvragen()
        }
    }

    trackSelected(l: TracksLedenDataset) {
        this.geselecteerdLid = l.LID_ID as number;
        this.Naam = l.lid.NAAM as string;
    }

    tijdString(dt: string): string {
        const datumtijd = DateTime.fromSQL(dt);
        return datumtijd.toFormat("HH:mm")
    }

    datumString(dt: string): string {
        const datumtijd = DateTime.fromSQL(dt);
        return datumtijd.day + "-" + datumtijd.month + "-" + datumtijd.year;
    }

    magTrackVerwijderen(trk: TracksLedenDataset) {
        const ui = this.loginService.userInfo;
        return (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == trk.INSTRUCTEUR_ID);
    }

    magTrackHerstellen(trk: TracksLedenDataset) {
        const ui = this.loginService.userInfo;
        return  (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == trk.INSTRUCTEUR_ID);
    }

    lidColumn(): boolean {
        return this.sharedService.getSchermSize() >= SchermGrootte.md;
    }
}
