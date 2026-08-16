import { Component, inject } from '@angular/core';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateFRParserFormatter } from '../../../shared/ngb-date-fr-parser-formatter';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import { StorageService } from '../../../services/storage/storage.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../services/apiservice/login.service';
import { HeliosUserinfo } from '../../../types/Helios';
import { LidEditorComponent } from '../../../shared/components/editors/lid-editor/lid-editor.component';

@Component({
    selector: 'app-profile',
    templateUrl: './profiel-page.component.html',
    styleUrls: ['./profiel-page.component.scss'],
    providers: [{ provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter }],
    imports: [LidEditorComponent]
})
export class ProfielPageComponent {
    private readonly loginService = inject(LoginService);
    private readonly storageService = inject(StorageService);
    private readonly activatedRoute = inject(ActivatedRoute);

    lidID: number;
    isVerwijderMode = false;
    isRestoreMode = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor() {

        // Als lidID is meegegeven in URL, moeten we de lidData ophalen
        this.activatedRoute.queryParams.subscribe(params => {
            if (params['lidID']) {
                this.lidID = params['lidID'];

                const ui = this.loginService.userInfo?.LidData;
                if (this.lidID != ui?.ID)    // we beijken profiel van iemand anders
                {
                    if (params['delete']) {     // we zijn onderweg om lid te verwijderen
                        this.isVerwijderMode = true;
                        this.isRestoreMode = false;
                    }
                    if (params['restore']) {    // we zijn onderweg om lid weer terug te halen
                        this.isVerwijderMode = false;
                        this.isRestoreMode = true;
                    }
                }
            } else {
                this.lidID = (this.storageService.ophalen('userInfo') as HeliosUserinfo).LidData?.ID ?? -1;
            }
        });
    }
}
