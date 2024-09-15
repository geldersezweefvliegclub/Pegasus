import {Component, OnInit, ViewChild} from '@angular/core';
import {HeliosLedenDataset, HeliosTrack} from "../../../../types/Helios";
import {ModalComponent} from "../../modal/modal.component";
import {TracksService} from "../../../../services/apiservice/tracks.service";
import {LedenService} from "../../../../services/apiservice/leden.service";
import {LoginService} from "../../../../services/apiservice/login.service";
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {Subscription} from "rxjs";
import {TracksLedenDataset} from "../../tracks/tracks.component";

@Component({
    selector: 'app-track-editor',
    templateUrl: './track-editor.component.html',
    styleUrls: ['./track-editor.component.scss']
})
export class TrackEditorComponent implements OnInit{
    @ViewChild(ModalComponent) private popup: ModalComponent;

    private ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];
    track: HeliosTrack = {}

    isLoading = false;
    isSaving = false;

    isVerwijderMode = false;
    isRestoreMode = false;
    toonLidSelectie = false;
    formTitel: string;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;


    constructor(private readonly trackService: TracksService,
                private readonly ledenService: LedenService,
                private readonly loginService: LoginService) {
    }

    ngOnInit() {
        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.leden = (leden) ? leden : [];
        });
    }

    // Open invoer popup voor de track. Als track ingevuld is, wijzigen we bestaande track
    openPopup(track: TracksLedenDataset | null, LID_ID?: number, START_ID?: number, NAAM?: string, TEKST?:string) {
        this.toonLidSelectie = (track || LID_ID) ? false : true;

        if (track) {
            // vul alvast de editor met starts uit het grid
            this.track = {
                LID_ID: track.LID_ID,
                START_ID: track.START_ID,
                TEKST: track.TEKST,
                INSTRUCTEUR_ID: track.ID
            };

            this.formTitel = 'Track bewerken van ' + NAAM;
            this.haalTrackOp(track.ID!);    // maar starts kan gewijzigd zijn, dus toch even starts ophalen van API
        } else {
            const ui = this.loginService.userInfo?.LidData;

            this.formTitel = (this.toonLidSelectie) ? 'Track toevoegen' : 'Track toevoegen voor ' + NAAM
            this.track = {
                LID_ID: LID_ID,
                START_ID: START_ID,
                TEKST: TEKST,
                INSTRUCTEUR_ID: ui?.ID
            };
        }
        this.isSaving = false;
        this.isVerwijderMode = false;
        this.isRestoreMode = false;
        this.popup.open();
    }

    closePopup() {
        this.popup.close();
    }

    // ophalen van track uit de database (via API)
    haalTrackOp(id: number): void {
        this.isLoading = true;

        try {
            this.trackService.getTrack(id).then((trk) => {
                this.track = trk;
                this.isLoading = false;
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    // Toon popup om track te verwijderen
    openVerwijderPopup(id: number, NAAM: string) {
        this.haalTrackOp(id);
        this.formTitel = 'Track verwijderen van ' + NAAM;
        this.toonLidSelectie = false;

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    // Toon popup om track uit de prullenbak te halen
    openRestorePopup(id: number, NAAM: string) {
        this.haalTrackOp(id);
        this.formTitel = 'Track herstellen voor ' + NAAM;
        this.toonLidSelectie = false;

        this.isSaving = false;
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    // uitvoeren van de actie waar we mee bezig zijn
    uitvoeren() {
        this.isSaving = true;
        if (this.isRestoreMode) {
            this.Herstellen(this.track);
        }

        if (this.isVerwijderMode) {
            this.Verwijderen(this.track);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.track.ID) {
                this.Aanpassen(this.track);
            } else {
                this.Toevoegen(this.track);
            }
        }
    }

    // opslaan van de starts van een nieuwe track
    Toevoegen(track: HeliosTrack) {
        this.trackService.addTrack(track).then(() => {
            this.success = {
                titel: "Track",
                beschrijving: "Bericht is toegevoegd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // bestaande track is aangepast. Opslaan van de starts
    Aanpassen(track: HeliosTrack) {
        this.trackService.updateTrack(track).then(() => {
            this.success = {
                titel: "Track",
                beschrijving: "Bericht is gewijzigd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // markeer een track als verwijderd
    Verwijderen(track: HeliosTrack) {
        this.trackService.deleteTrack(track.ID!).then(() => {
            this.success = {
                titel: "Track",
                beschrijving: "Bericht is verwijderd"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // de track herstellen, haal de markering 'verwijderd' weg
    Herstellen(track: HeliosTrack) {
        this.trackService.restoreTrack(track.ID!).then(() => {
            this.success = {
                titel: "Track",
                beschrijving: "Bericht is weer beschikbaar"
            }
            this.closePopup();
        }).catch(e => {
            this.isSaving = false;
            this.error = e;
        })
    }

    // Over welke vlieger gaat deze track
    lidGeselecteerd(id: number | undefined) {
        this.track.LID_ID = id;
    }

    // Opslaan knop staat uit als we niet weten over wie het gaat, of er nog geen tekst is ingevoerd
    opslaanDisabled() {
        if (this.toonLidSelectie) {
           return !(this.track.LID_ID && this.track.TEKST) ;
        }
        else {
            return !this.track.TEKST;
        }
    }
}
