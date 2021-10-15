import {Component, OnInit, ViewChild} from '@angular/core';
import {HeliosLedenDataset, HeliosTrack} from "../../../../types/Helios";
import {ModalComponent} from "../../modal/modal.component";
import {TracksService} from "../../../../services/apiservice/tracks.service";
import {LedenService} from "../../../../services/apiservice/leden.service";
import {LoginService} from "../../../../services/apiservice/login.service";
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {Subscription} from "rxjs";

@Component({
    selector: 'app-track-editor',
    templateUrl: './track-editor.component.html',
    styleUrls: ['./track-editor.component.scss']
})
export class TrackEditorComponent implements OnInit{
    @ViewChild(ModalComponent) private popup: ModalComponent;

    ledenAbonnement: Subscription;
    leden: HeliosLedenDataset[] = [];
    track: HeliosTrack = {}

    isLoading: boolean = false;
    isSaving: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    toonLidSelectie: boolean = false;
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

    openPopup(id: number | null, LID_ID?: number, START_ID?: number, NAAM?: string, TEKST?:string) {
        this.toonLidSelectie = (id || LID_ID) ? false : true;

        if (id) {
            this.haalTrackOp(id);
            this.formTitel = 'Track bewerken van ' + NAAM;
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

    openVerwijderPopup(id: number, NAAM: string) {
        this.haalTrackOp(id);
        this.formTitel = 'Track verwijderen van ' + NAAM;
        this.toonLidSelectie = false;

        this.isSaving = false;
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    openRestorePopup(id: number, NAAM: string) {
        this.haalTrackOp(id);
        this.formTitel = 'Track herstellen voor ' + NAAM;
        this.toonLidSelectie = false;

        this.isSaving = false;
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

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
    // opslaan van de data van een nieuw vliegtuig
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

    // bestaande track is aangepast. Opslaan van de data
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

    lidGeselecteerd(id: number | undefined) {
        this.track.LID_ID = id;
    }

    opslaanDisabled() {
        if (this.toonLidSelectie) {
           return !(this.track.LID_ID && this.track.TEKST) ;
        }
        else {
            return !this.track.TEKST;
        }
    }
}
