import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { PegasusConfigService } from '../../../services/shared/pegasus-config.service';
import { ProgressieService } from '../../../services/apiservice/progressie.service';
import { HeliosBehaaldeProgressieDataset, HeliosCompetentiesDataset, HeliosLid } from '../../../types/Helios';
import { ErrorMessage, HeliosActie, SuccessMessage } from '../../../types/Utils';
import { SharedService } from '../../../services/shared/shared.service';
import { LoginService } from '../../../services/apiservice/login.service';
import { CompetentieService } from '../../../services/apiservice/competentie.service';
import { Subscription } from 'rxjs';
import { ProgressieEditorComponent } from '../editors/progressie-editor/progressie-editor.component';

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.scss']
})

export class StatusComponent implements OnInit, OnChanges, OnDestroy {
    @Input() Vlieger: HeliosLid;
    @ViewChild(ProgressieEditorComponent) private editor: ProgressieEditorComponent;

    cheks: any;
    overig: any;
    gehaaldeProgressie: HeliosBehaaldeProgressieDataset[];
    private dbEventAbonnement: Subscription;
    private competentiesAbonnement: Subscription;
    competenties: HeliosCompetentiesDataset[];
    suspend = false;
    isLoading = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    bevestigCompetentie: HeliosCompetentiesDataset | undefined;
    checkboxSelected: any;

    constructor(private readonly loginService: LoginService,
                private readonly configService: PegasusConfigService,
                private readonly sharedService: SharedService,
                private readonly competentieService: CompetentieService,
                private readonly progressieService: ProgressieService) {  }

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
        this.cheks = this.configService.getChecks();
        this.overig = this.configService.getOverig();
        this.ophalen();
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)         this.dbEventAbonnement.unsubscribe();
        if (this.competentiesAbonnement)    this.competentiesAbonnement.unsubscribe();
    }

    ophalen(): void {
        if (!this.cheks) // er zijn nog geen Checks
            return;

        // Als vlieger niet bekend is, kunnen we niets ophalen
        if (!this.Vlieger) {
            return;
        }

        // maak CSV string met de competentie IDs van de checks en overig
        let comptentieIDs = "";

        // checks
        comptentieIDs += this.cheks.Check.map((p: any) => {
            return p.CompetentieID.join(',');
        }).join(',');

        comptentieIDs += ',';
        comptentieIDs += this.overig.map((p: any) => {
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

    CheckGehaald(comptentieID: number): boolean {
        if (!this.gehaaldeProgressie) return false;

        if (this.gehaaldeProgressie.findIndex((p) => p.COMPETENTIE_ID == comptentieID) < 0) {
            return false;
        } else {
            return true;
        }
    }

    CheckDisabled(comptentieID: number): boolean {
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
    zetProgressie(id:number) {
        this.editor.openNieuwPopup(id);
    }

    competentieBestaat(id: number) {
        if (this.competenties.length == 0)
            return false;

        // findIndexs geeft -1 als niet gevonden
        return (this.competenties.findIndex(c => c.ID == id) >= 0);
    }
}
