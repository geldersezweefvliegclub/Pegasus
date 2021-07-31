import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {HeliosLid, HeliosTrack} from "../../../../types/Helios";
import {ModalComponent} from "../../modal/modal.component";
import {TracksService} from "../../../../services/apiservice/tracks.service";
import {LedenService} from "../../../../services/apiservice/leden.service";
import {LoginService} from "../../../../services/apiservice/login.service";

@Component({
    selector: 'app-track-editor',
    templateUrl: './track-editor.component.html',
    styleUrls: ['./track-editor.component.scss']
})
export class TrackEditorComponent {
    @Output() add: EventEmitter<HeliosTrack> = new EventEmitter<HeliosTrack>();
    @Output() update: EventEmitter<HeliosTrack> = new EventEmitter<HeliosTrack>();
    @Output() delete: EventEmitter<number> = new EventEmitter<number>();
    @Output() restore: EventEmitter<number> = new EventEmitter<number>();

    @ViewChild(ModalComponent) private popup: ModalComponent;

    lid: HeliosLid = {};
    track: HeliosTrack = {}

    isLoading: boolean = false;

    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;
    formTitel: string;

    constructor(private readonly trackService: TracksService,
                private readonly ledenService: LedenService,
                private readonly loginService: LoginService) {
    }

    openPopup(id: number | null, LID_ID?: number, START_ID?: number, NAAM?: string, TEKST?:string) {
        this.lid = {NAAM: "..."};

        if (id) {
            this.haalTrackOp(id);
            this.formTitel = 'Track bewerken van '
        } else {
            let ui = this.loginService.userInfo?.LidData;

            this.formTitel = 'Track toevoegen voor '
            this.track = {
                LID_ID: LID_ID,
                START_ID: START_ID,
                TEKST: TEKST,
                INSTRUCTEUR_ID: ui?.ID
            };
            this.lid = { NAAM: NAAM}
        }
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
                this.haalLidOp(trk.LID_ID!);
                this.isLoading = false;
            });
        } catch (e) {
            this.isLoading = false;
        }
    }

    haalLidOp(id: number): void {
        this.ledenService.getLid(id).then((lid: HeliosLid) => {
            this.lid = lid;
        });
    }

    openVerwijderPopup(id: number) {
        this.lid = {NAAM: "..."};
        this.haalTrackOp(id);
        this.formTitel = 'Track verwijderen van ';
        this.isVerwijderMode = true;
        this.isRestoreMode = false;
        this.popup.open();
    }

    openRestorePopup(id: number) {
        this.lid = {NAAM: "..."};
        this.haalTrackOp(id);
        this.formTitel = 'Track herstellen voor ';
        this.isRestoreMode = true;
        this.isVerwijderMode = false;
        this.popup.open();
    }

    uitvoeren() {
        if (this.isRestoreMode) {
            this.restore.emit(this.track.ID);
        }

        if (this.isVerwijderMode) {
            this.delete.emit(this.track.ID);
        }

        if (!this.isVerwijderMode && !this.isRestoreMode) {
            if (this.track.ID) {
                this.update.emit(this.track);
            } else {
                this.add.emit(this.track);
            }
        }
    }
}
