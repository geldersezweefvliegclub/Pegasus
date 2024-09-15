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
    selector: 'app-pvb',
    templateUrl: './pvb.component.html',
    styleUrls: ['./pvb.component.scss']
})
export class PvbComponent implements OnInit, OnChanges, OnDestroy {
    @Input() Vlieger: HeliosLid;
    @ViewChild(ProgressieEditorComponent) private editor: ProgressieEditorComponent;

    PVBs: any[];
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
                private readonly progressieService: ProgressieService) { }

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
        this.PVBs = this.configService.getPVB();
        this.ophalen();
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)         this.dbEventAbonnement.unsubscribe();
        if (this.competentiesAbonnement)    this.competentiesAbonnement.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("Vlieger")) {
            this.ophalen()
        }
    }

    ophalen(): void {
        if (!this.PVBs) // er zijn nog geen PVB geconfigureerd
            return;

        // Als vlieger niet bekend is, kunnen we niets ophalen
        if (!this.Vlieger) {
            return;
        }

        // maak CSV string met de competentie IDs van de PVBs
        const comptentieIDs = this.PVBs.map((p: any) => {
            let str = "";
            if (p.Lokaal != undefined) str += p.Lokaal;
            if (p.Overland != undefined) {
                str += (str == undefined) ? "" : ",";
                str += p.Overland;
            }
            return str;
        }).join(',');

        this.isLoading = true;
        this.progressieService.getProgressiesLid(this.Vlieger.ID!, comptentieIDs).then((p) => {
            this.gehaaldeProgressie = p;
            this.isLoading = false;
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });
    }

    PVBgehaald(comptentieID: number): boolean {

        if (!this.gehaaldeProgressie) return false;

        if (this.gehaaldeProgressie.findIndex((p) => p.COMPETENTIE_ID == comptentieID) >= 0) {
            return true;
        }
        return false;
    }

    // De checkbox is soms disabled.
    CheckDisabled(comptentieID: number): boolean {
        const ui = this.loginService.userInfo?.Userinfo;

        if (this.Vlieger === undefined) {
            return true;    // als de vlieger niet bekend is, kunnen er ook geen vinkjes gezet worden
        }
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

    // Zorg ervoor dat we niet gaan laden
    uitstellen(): void {
        this.suspend = true;
        setTimeout(() => this.suspend = false, 1000);
    }

    // Progressie kan gezet worden via snelkeuze in deze component, lange weg kan via progressie boom
    zetProgressie(e:any, id:number) {
        this.editor.openNieuwPopup(id);
    }

    // Check of het ID uit de configuratie ook daadwerkelijk bestaat
    competentieBestaat(id: number|undefined) {
        if (id == undefined)
            return false;

        if (this.competenties.length == 0)
            return false;
        return (this.competenties.findIndex(c => c.ID == id) < 0) ? false : true;
    }
}

