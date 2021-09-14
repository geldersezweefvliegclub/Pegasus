import {Component} from '@angular/core';
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {NgbDateFRParserFormatter} from '../../shared/ngb-date-fr-parser-formatter';
import {ErrorMessage, SuccessMessage} from '../../types/Utils';
import {StorageService} from '../../services/storage/storage.service';
import {HeliosLid} from '../../types/Helios';
import {LedenService} from '../../services/apiservice/leden.service';
import {ActivatedRoute, Router} from '@angular/router';
import {LoginService} from "../../services/apiservice/login.service";
import {ImageService} from "../../services/apiservice/image.service";

@Component({
    selector: 'app-profile',
    templateUrl: './profiel-page.component.html',
    styleUrls: ['./profiel-page.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class ProfielPageComponent {
    lidID: number;
    isVerwijderMode: boolean = false;
    isRestoreMode: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly ledenService: LedenService,
                private storageService: StorageService,
                private readonly loginService: LoginService,
                private readonly imageService: ImageService,
                private readonly router: Router,
                private activatedRoute: ActivatedRoute) {

        // Als lidID is meegegeven in URL, moeten we de lidData ophalen
        this.activatedRoute.queryParams.subscribe(params => {
            if (params['lidID']) {
                this.lidID = params['lidID'];

                const ui = this.loginService.userInfo?.LidData;
                if (this.lidID != ui?.ID)    // we beijken profiel van iemand anders
                {
                    if (params['delete']) {     // we zijn onderweeg om lid te verwijderen
                        this.isVerwijderMode = true;
                        this.isRestoreMode = false;
                    }
                    if (params['restore']) {    // we zijn onderweg om lid weer terug te halen
                        this.isVerwijderMode = false;
                        this.isRestoreMode = true;
                    }
                }
            } else {
                this.lidID = this.storageService.ophalen('userInfo').LidData.ID;
            }
        });
    }

    // wat gaan we doen, toevoegen, update, verwijderen of restore
    opslaan(lid: HeliosLid): void {
        if (this.isRestoreMode) {
            this.restore(lid)
        }
        else if (this.isVerwijderMode) {
            this.delete(lid)
        }
        else if (lid.ID && lid.ID > 0) {
            this.updateLid(lid)
        } else {
            this.nieuwLid(lid)
        }
    }

    opslaanAvatar(image: string) {
        try {
            this.imageService.uploadFoto(this.lidID, image).then(() =>
                this.success = { titel: "upload avatar", beschrijving: "Foto is succesvol opgeslagen"}
            );
        }
        catch (e)
        {
            this.success = undefined;
            this.error = e;
        }
    }

    // markeer lid als verwijderd
    delete(lid: HeliosLid): void {
        let msg: SuccessMessage;

        this.ledenService.deleteLid(this.lidID).then(() => {
            this.error = undefined;
            this.success = {titel: "Profiel", beschrijving: lid.NAAM + " is verwijderd"}

            setTimeout(() => this.router.navigate(['/leden']), 3000);
        }).catch(e => {
            this.success = undefined;
            this.error = e;
        });
    }

    // haal een lid terug door verwijderd vlag te resetten
    restore(lid: HeliosLid): void {
        this.ledenService.restoreLid(this.lidID).then(() => {
            this.error = undefined;
            this.success = {titel: "Profiel", beschrijving: lid.NAAM + " is weer beschikbaar"}

            setTimeout(() => this.router.navigate(['/leden']), 3000);
        }).catch(e => {
            this.success = undefined;
            this.error = e;
        });
    }

    // update bestaand lid
    updateLid(lid: HeliosLid): void {
        this.ledenService.updateLid(lid).then(() => {
            this.error = undefined;

            if (this.lidID == this.storageService.ophalen('userInfo').LidData.ID) {
                this.success = {titel: "Profiel", beschrijving: "Uw profiel is aangepast"}
            }
            else {
                this.success = {titel: "Profiel", beschrijving: "Profiel " + lid.NAAM + " is aangepast"}
            }
        }).catch(e => {
            this.success = undefined;
            this.error = e;
        });
    }

    // nieuw lid toevoegen aan het leden bestand
    nieuwLid(lid: HeliosLid): void {
        this.ledenService.addLid(lid).then((l) => {
            this.error = undefined;
            this.success = {titel: "Profiel", beschrijving: l.NAAM + " is toegevoegd"}
        }).catch(e => {
            this.success = undefined;
            this.error = e;
        });
    }
}
