import { Component, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, input, viewChild } from '@angular/core';
import { HeliosLedenDataset, HeliosTrack, HeliosTracksDataset } from '../../../types/Helios';
import { TracksService } from '../../../services/apiservice/tracks.service';
import { SchermGrootte, SharedService } from '../../../services/shared/shared.service';
import { TrackEditorComponent } from '../editors/track-editor/track-editor.component';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import {
    faAddressCard,
    faBookmark,
    faMinusCircle,
    faPlane,
    faRecycle,
    faTachometerAlt,
    faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { ErrorMessage, HeliosActie, SuccessMessage } from '../../../types/Utils';
import { LedenService } from '../../../services/apiservice/leden.service';
import { LoginService } from '../../../services/apiservice/login.service';
import { faAvianex } from '@fortawesome/free-brands-svg-icons';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import { ErrorComponent } from '../error/error.component';
import { SuccessComponent } from '../success/success.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AvatarComponent } from '../avatar/avatar.component';
import { RouterLink } from '@angular/router';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { StatusButtonComponent } from '../status-button/status-button.component';
import { PegasusCardComponent } from '../pegasus-card/pegasus-card.component';
import { StatusComponent } from '../status/status.component';
import { PvbComponent } from '../pvb/pvb.component';
import { RecencyComponent } from '../recency/recency.component';
import { VliegerLogboekTotalenComponent } from '../vlieger-logboek-totalen/vlieger-logboek-totalen.component';

export interface TracksLedenDataset extends HeliosTracksDataset {
    lid: HeliosLedenDataset;
}

@Component({
    selector: 'app-tracks',
    templateUrl: './tracks.component.html',
    styleUrls: ['./tracks.component.scss'],
    imports: [ErrorComponent, SuccessComponent, FaIconComponent, AvatarComponent, RouterLink, IconButtonComponent, StatusButtonComponent, PegasusCardComponent, StatusComponent, PvbComponent, RecencyComponent, VliegerLogboekTotalenComponent, TrackEditorComponent]
})
export class TracksComponent implements OnInit, OnDestroy, OnChanges {
    readonly VliegerID = input<number>();
    readonly VliegerNaam = input('');
    readonly toonLid = input(false);
    iconCardIcon: IconDefinition = faAddressCard;
    prullenbakIcon: IconDefinition = faRecycle;

    // variablen in html formulier
    protected iconRecency: IconDefinition = faTachometerAlt;
    protected iconPVB: IconDefinition = faAvianex;
    protected iconStatus: IconDefinition = faBookmark;
    protected iconPlane: IconDefinition = faPlane;
    protected deleteIcon: IconDefinition = faMinusCircle;
    protected restoreIcon: IconDefinition = faUndo;
    protected data: TracksLedenDataset[] = [];
    protected datum: DateTime = DateTime.now();      // de gekozen dag
    protected zoekString: string;
    protected deleteMode = false;        // zitten we in delete mode om vliegtuigen te kunnen verwijderen
    protected trashMode = false;         // zitten in restore mode om vliegtuigen te kunnen terughalen
    protected isLoading = false;
    protected success: SuccessMessage | undefined;
    protected error: ErrorMessage | undefined;
    protected magToevoegen = true;
    protected magVerwijderen = false;
    protected magWijzigen = false;
    protected geselecteerdLid: HeliosLedenDataset;

    // private variable voor ts script
    private readonly trackService = inject(TracksService);
    private readonly ledenService = inject(LedenService);
    private readonly loginService = inject(LoginService);
    private readonly sharedService = inject(SharedService);
    private readonly trackEditor = viewChild.required(TrackEditorComponent);

    private dbEventAbonnement: Subscription;
    private ledenAbonnement: Subscription;
    private leden: HeliosLedenDataset[] = [];
    private datumAbonnement: Subscription; // volg de keuze van de kalender
    private zoekTimer: number;                  // kleine vertraging om starts ophalen te beperken

    ngOnInit(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isCIMT) ? true : false;

        // Alleen als we onderstaande rollen hebben kunnen we Tracks gebruiken
        if (ui?.isCIMT || ui?.isInstructeur || ui?.isBeheerder) {
            // de datum zoals die in de kalender gekozen is
            this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
                if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                    this.datum = DateTime.fromObject({
                        year: jaarMaand.year,
                        month: jaarMaand.month,
                        day: 1
                    })
                }
            });

            // abonneer op wijziging van leden
            this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
                this.leden = (leden) ? leden : [];
                this.lidToevoegenAanTrack();
            });

            // Als in de tracks tabel is aangepast, moet we onze dataset ook aanpassen
            this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
                if (ev.tabel == "Tracks") {
                    const VliegerID = this.VliegerID();
                    // bij verwijderen/herstellen bevat data enkel het ID, dan altijd opvragen
                    if (!VliegerID || ev.actie == HeliosActie.Delete || ev.actie == HeliosActie.Restore) {
                        this.opvragen();
                    } else if (ev.data.LID_ID == VliegerID) {
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
        if (this.ledenAbonnement)     this.ledenAbonnement.unsubscribe();
    }

    // open de track editor om nieuwe track toe te voegen. Editor opent als popup
    protected openTrackEditor() {
        this.trackEditor().openPopup(null, this.VliegerID(), undefined, this.VliegerNaam());
    }

    // open de track editor om nieuwe track toe te voegen. Editor opent als popup
    protected replyTrackEditor(trk: TracksLedenDataset) {
        const tekst = "In reactie op: \n----------------\n" + trk.TEKST + "\n----------------\n";
        this.trackEditor().openPopup(null, trk.LID_ID, undefined, trk.LID_NAAM, tekst);
    }

    // Toevoegen van een vlieger track aan de database
    ToevoegenTrack(track: HeliosTrack): void {
        this.trackService.addTrack(track);
        this.trackEditor().closePopup();
    }

    // openen van popup om gegevens van een bestaande track aan te passen
    protected openEditor(trk: TracksLedenDataset) {
        const ui = this.loginService.userInfo?.LidData;

        // Je mag alleen tracks van jezelf wijzigen
        if ((trk.INSTRUCTEUR_ID == ui!.ID) || (this.magWijzigen)) {
            this.trackEditor().openPopup(trk, trk.LID_ID, undefined, trk.LID_NAAM as string);
        }
        else {
            window.alert("U bent niet gemachtigd om deze track aan te passen");
        }
    }

    // openen van popup om track te verwijderen
    protected openVerwijderPopup(trk: TracksLedenDataset) {
        this.trackEditor().openVerwijderPopup(trk.ID as number, trk.LID_NAAM as string);
    }

    // openen van popup om track te hestellen
    protected openRestorePopup(trk: TracksLedenDataset) {
        this.trackEditor().openRestorePopup(trk.ID as number, trk.LID_NAAM as string);
    }

    // schakelen tussen deleteMode JA/NEE. In deleteMode kun je vliegtuigen verwijderen
    protected deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
    }

    // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde vliegtuigen getoond
    protected trashModeJaNee(actief: boolean) {
        this.trashMode = actief;
        this.opvragen();
    }

    // Opvragen van de starts via de api
    protected opvragen(): void {
        clearTimeout(this.zoekTimer);

        const maxTrackItems = (this.VliegerID()) ? -1 : 100; // alle tracks voor een vlieger, anders 100 items

        this.zoekTimer = window.setTimeout(() => {
            this.isLoading = true;
            this.trackService.getTracks(this.trashMode, this.VliegerID(), maxTrackItems).then((dataset) => {
                this.isLoading = false;
                this.data = dataset as TracksLedenDataset[];
                this.lidToevoegenAanTrack();
            }).catch(e => {
                this.isLoading = false;
                this.error = e;
            });
        }, 400);
    }

    private lidToevoegenAanTrack() {
        for (const item of this.data) {
            item.lid = this.leden.find(l => l.ID == item.LID_ID) as HeliosLedenDataset;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (Object.prototype.hasOwnProperty.call(changes, "VliegerID")) {
            this.opvragen()
        }
    }

    protected trackSelected(s: TracksLedenDataset) {
        this.geselecteerdLid = this.leden.find(l => l.ID == s.LID_ID) as HeliosLedenDataset;
    }

    protected tijdString(dt: string): string {
        const datumtijd = this.sharedService.parseDatum(dt);
        return datumtijd.toFormat("HH:mm")
    }

    protected datumString(dt: string): string {
        const datumtijd = this.sharedService.parseDatum(dt);
        return datumtijd.day + "-" + datumtijd.month + "-" + datumtijd.year;
    }

    protected magTrackVerwijderen(trk: TracksLedenDataset) {
        const ui = this.loginService.userInfo;
        return (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == trk.INSTRUCTEUR_ID);
    }

    protected magTrackHerstellen(trk: TracksLedenDataset) {
        const ui = this.loginService.userInfo;
        return  (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == trk.INSTRUCTEUR_ID);
    }

    protected lidColumn(): boolean {
        return this.sharedService.getSchermSize() >= SchermGrootte.md;
    }
}
