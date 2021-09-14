import {Component, Input, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {HeliosLedenDataset, HeliosTrack, HeliosTracksDataset} from "../../../types/Helios";
import {TracksService} from "../../../services/apiservice/tracks.service";
import {SharedService} from "../../../services/shared/shared.service";
import {TrackEditorComponent} from "../editors/track-editor/track-editor.component";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {
    faBookmark,
    faAddressCard,
    faMinusCircle,
    faPlane,
    faRecycle,
    faTachometerAlt, faUndo
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
export class TracksComponent implements OnInit {
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

    data: TracksLedenDataset[] = [];
    leden: HeliosLedenDataset[] = [];

    datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag

    zoekString: string;
    zoekTimer: number;                  // kleine vertraging om data ophalen te beperken
    deleteMode: boolean = false;        // zitten we in delete mode om vliegtuigen te kunnen verwijderen
    trashMode: boolean = false;         // zitten in restore mode om vliegtuigen te kunnen terughalen

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
        this.magWijzigen = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;

        // Alleen als we onderstaande rollen hebben kunnen we Tracks gebruiken
        if (ui?.isCIMT || ui?.isInstructeur || ui?.isBeheerder) {
            // de datum zoals die in de kalender gekozen is
            this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1
                })
            })

            this.ledenService.getLeden(false).then((dataset) => {
                this.leden = dataset;
                this.opvragen();
            });

            // Als in de progressie tabel is aangepast, moet we onze dataset ook aanpassen
            this.sharedService.heliosEventFired.subscribe(ev => {
                if (ev.tabel == "Tracks") {
                    if (!this.VliegerID) {
                        this.opvragen();
                    } else if (ev.data.LID_ID == this.VliegerID) {
                        this.opvragen();
                    }
                }
            });
        }
    }

    // open de track editor om nieuwe track toe te voegen. Editor opent als popup
    private openTrackEditor() {
        this.trackEditor.openPopup(null, this.VliegerID, undefined, this.VliegerNaam);
    }

    // Toevoegen van een vlieger track aan de database
    ToevoegenTrack(track: HeliosTrack): void {
        this.trackService.addTrack(track);
        this.trackEditor.closePopup();
    }

    // openen van popup om gegevens van een bestaande track aan te passen
    openEditor(trk: TracksLedenDataset) {
        this.trackEditor.openPopup(trk.ID as number, trk.LID_ID, undefined, trk.LID_NAAM as string);
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

        const maxTrackItems = (this.VliegerID) ? -1 : 200; // alle tracks voor een vlieger, anders 200 items

        this.zoekTimer = window.setTimeout(() => {
            this.trackService.getTracks(this.trashMode, this.VliegerID, maxTrackItems).then((dataset) => {
                this.data = dataset as TracksLedenDataset[];

                for (let i = 0; i < this.data.length; i++) {
                    this.data[i].lid = this.leden.find(l => l.ID == this.data[i].LID_ID) as HeliosLedenDataset;
                }
            });
        }, 400);
    }

    // opslaan van de data van een nieuw vliegtuig
    Toevoegen(track: HeliosTrack) {
        this.trackService.addTrack(track).then(() => {
            this.opvragen();
            this.trackEditor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    // bestaande track is aangepast. Opslaan van de data
    Aanpassen(track: HeliosTrack) {
        this.trackService.updateTrack(track).then(() => {
            this.opvragen();
            this.trackEditor.closePopup();
        }).catch(e => {
            this.error = e;
        })
    }

    // markeer een track als verwijderd
    Verwijderen(id: number) {
        this.trackService.deleteTrack(id).then(() => {
            this.deleteMode = false;
            this.trashMode = false;

            this.opvragen();
            this.trackEditor.closePopup();
        });
    }

    // de track herstellen, haal de markering 'verwijderd' weg
    Herstellen(id: number) {
        this.trackService.restoreTrack(id).then(() => {
            this.deleteMode = false;
            this.trashMode = false;

            this.opvragen();
            this.trackEditor.closePopup();
        });
    }


    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("VliegerID")) {
            this.opvragen()
        }
    }

    BreedteGrid() {
        return (this.toonLid) ? "col-9" : "col-12";        // 9 breed met naam, 12 alleen grid
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

        if (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == trk.INSTRUCTEUR_ID)
            return true;

        return false;
    }

    magTrackHerstellen(trk: TracksLedenDataset) {
        const ui = this.loginService.userInfo;

        if (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == trk.INSTRUCTEUR_ID)
            return true;

        return false;
    }
}
