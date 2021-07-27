import {Component} from '@angular/core';
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {NgbDateFRParserFormatter} from '../../shared/ngb-date-fr-parser-formatter';
import {CustomError} from '../../types/Utils';
import {StorageService} from '../../services/storage/storage.service';
import {HeliosLid} from '../../types/Helios';
import {LedenService} from '../../services/apiservice/leden.service';
import {ActivatedRoute, Router} from '@angular/router';
import {LoginService} from "../../services/apiservice/login.service";

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
    error: CustomError | undefined;

    constructor(private readonly ledenService: LedenService,
                private storageService: StorageService,
                private readonly loginService: LoginService,
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
            this.restore(lid.ID as number)
        }
        else if (this.isVerwijderMode) {
            this.delete(lid.ID as number)
        }
        else if (lid.ID && lid.ID > 0) {
            this.updateLid(lid)
        } else {
            this.nieuwLid(lid)
        }
    }

    // markeer lid als verwijderd
    delete(lidID: number): void {
        this.ledenService.deleteLid(lidID).then(() => {
            this.error = undefined;
            this.router.navigate(['/leden']);
        }).catch(e => {
            this.error = e;
        });
    }

    // haal een lid terug door verwijderd vlag te resetten
    restore(lidID: number): void {
        this.ledenService.restoreLid(lidID).then(() => {
            this.error = undefined;
            this.router.navigate(['/leden']);
        }).catch(e => {
            this.error = e;
        });
    }

    // update bestaand lid
    updateLid(lid: HeliosLid): void {
        this.ledenService.updateLid(lid).then(() => {
            this.error = undefined;
        }).catch(e => {
            this.error = e;
        });
    }

    // nieuw lid toevoegen aan het leden bestand
    nieuwLid(lid: HeliosLid): void {
        this.ledenService.nieuwLid(lid).then(() => {
            this.error = undefined;
        }).catch(e => {
            this.error = e;
        });
    }
}
