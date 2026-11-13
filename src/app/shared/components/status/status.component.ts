import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, viewChild } from '@angular/core';
import { PegasusConfigService } from '../../../services/shared/pegasus-config.service';
import { ProgressieService } from '../../../services/apiservice/progressie.service';
import { HeliosBehaaldeProgressieDataset, HeliosCompetentiesDataset, HeliosLid } from '../../../types/Helios';
import { ErrorMessage, HeliosActie, SuccessMessage } from '../../../types/Utils';
import { SharedService } from '../../../services/shared/shared.service';
import { LoginService } from '../../../services/apiservice/login.service';
import { CompetentieService } from '../../../services/apiservice/competentie.service';
import { Subscription } from 'rxjs';
import { ProgressieEditorComponent } from '../editors/progressie-editor/progressie-editor.component';
import { Check, Overig } from '../../../types/IPegasusConfig';
import { ErrorComponent } from '../error/error.component';
import { SuccessComponent } from '../success/success.component';
import { LoaderComponent } from '../loader/loader.component';

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.scss'],
    imports: [ErrorComponent, SuccessComponent, LoaderComponent, ProgressieEditorComponent]
})

export class StatusComponent implements OnInit, OnChanges, OnDestroy {
    @Input() Vlieger: HeliosLid;

    // variablen in html formulier
    protected checks: { Jaren: number[], Check: Check[] };
    protected overig: Overig[];
    protected competenties: HeliosCompetentiesDataset[];
    protected isLoading = false;
    protected success: SuccessMessage | undefined;
    protected error: ErrorMessage | undefined;

    // private variable voor ts script
    private readonly loginService = inject(LoginService);
    private readonly configService = inject(PegasusConfigService);
    private readonly sharedService = inject(SharedService);
    private readonly competentieService = inject(CompetentieService);
    private readonly progressieService = inject(ProgressieService);
    private readonly editor = viewChild.required(ProgressieEditorComponent);

    private gehaaldeProgressie: HeliosBehaaldeProgressieDataset[];
    private dbEventAbonnement: Subscription;
    private competentiesAbonnement: Subscription;
    private suspend = false;

    ngOnInit(): void {
        // Als in de progressie tabel is aangepast, moet we onze dataset ook aanpassen
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Progressie") {
                if (!this.suspend && (ev.actie == HeliosActie.Add || ev.actie == HeliosActie.Delete)) {
                    this.ophalen();
                }
            }
        });

        // abonneer op wijziging van competenties
        this.competentiesAbonnement = this.competentieService.competentiesChange.subscribe(dataset => {
            this.competenties = dataset!;
        });
        this.checks = this.configService.getChecks();
        this.overig = this.configService.getOverig();
        this.ophalen();
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)         this.dbEventAbonnement.unsubscribe();
        if (this.competentiesAbonnement)    this.competentiesAbonnement.unsubscribe();
    }

    protected ophalen(): void {
        if (!this.checks) // er zijn nog geen Checks
            return;

        // Als vlieger niet bekend is, kunnen we niets ophalen
        if (!this.Vlieger) {
            return;
        }

        // maak CSV string met de competentie IDs van de checks en overig
        let comptentieIDs = "";

        // checks
        comptentieIDs += this.checks.Check.map((p) => {
            return p.CompetentieID.join(',');
        }).join(',');

        comptentieIDs += ',';
        comptentieIDs += this.overig.map((p) => {
            return p.CompetentieID;
        }).join(',');

        this.isLoading = true;
        this.progressieService.getProgressiesLid(this.Vlieger.ID!, comptentieIDs).then((p) => {
            this.isLoading = false;
            this.gehaaldeProgressie = p
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });
    }

    protected CheckGehaald(comptentieID: number): boolean {
        if (!this.gehaaldeProgressie) return false;

        if (this.gehaaldeProgressie.findIndex((p) => p.COMPETENTIE_ID == comptentieID) < 0) {
            return false;
        } else {
            return true;
        }
    }

    protected CheckDisabled(comptentieID: number): boolean {
        const ui = this.loginService.userInfo?.Userinfo;

        if (this.Vlieger.ID == this.loginService.userInfo?.LidData?.ID) {
            return true;    // niet voor jezelf vinkjes zetten
        }
        if (!ui?.isBeheerder && !ui?.isInstructeur && !ui?.isCIMT) {
            return true;    // alleen beheerder, instructeuers en CIMT mogen competentie zetten
        }

        if (!this.gehaaldeProgressie) return false;

        if (this.gehaaldeProgressie.findIndex((p) => p.COMPETENTIE_ID == comptentieID) >= 0) {
            return true;
        }
        return false;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (Object.prototype.hasOwnProperty.call(changes, "Vlieger")) {
            this.ophalen()
        }
    }

    // Progressie kan gezet worden via snelkeuze in deze component, lange weg kan via progressie boom
    protected zetProgressie(id:number) {
        this.editor().openNieuwPopup(id);
    }

    protected competentieBestaat(id: number) {
        if (this.competenties.length == 0)
            return false;

        // findIndexs geeft -1 als niet gevonden
        return (this.competenties.findIndex(c => c.ID == id) >= 0);
    }
}
