import { Component, inject } from '@angular/core';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateFRParserFormatter } from '../../../shared/ngb-date-fr-parser-formatter';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../services/apiservice/login.service';
import { LidEditorComponent } from '../../../shared/components/editors/lid-editor/lid-editor.component';

@Component({
    selector: 'app-profile',
    templateUrl: './profiel-page.component.html',
    styleUrls: ['./profiel-page.component.scss'],
    providers: [{ provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter }],
    imports: [LidEditorComponent]
})
export class ProfielPageComponent {
    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    // variablen in html formulier
    protected lidID: number;
    protected isVerwijderMode = false;
    protected isRestoreMode = false;

    // private variable voor ts script
    private readonly loginService = inject(LoginService);
    private readonly activatedRoute = inject(ActivatedRoute);

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
                this.lidID = this.loginService.userInfo?.LidData?.ID ?? -1;
            }
        });
    }
}
