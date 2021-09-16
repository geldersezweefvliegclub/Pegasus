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

    constructor(private readonly loginService: LoginService,
                private readonly storageService: StorageService,
                private readonly activatedRoute: ActivatedRoute) {

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
}
