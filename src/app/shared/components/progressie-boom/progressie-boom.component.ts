import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {TreeviewItem, TreeviewConfig} from 'ngx-treeview';
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {HeliosCompetentiesDataset, HeliosProgressie, HeliosProgressieBoom} from "../../../types/Helios";
import {LoginService} from "../../../services/apiservice/login.service";
import {ModalComponent} from "../modal/modal.component";
import {ErrorMessage, HeliosActie, SuccessMessage} from "../../../types/Utils";
import {SharedService} from "../../../services/shared/shared.service";
import {CompetentieService} from "../../../services/apiservice/competentie.service";
import {Subscription} from "rxjs";

export class ProgressieTreeviewItemComponent extends TreeviewItem {
    ProgresssieID: number | undefined;
    Instructeur: string | undefined;
    Behaald: string | undefined;
}

@Component({
    selector: 'app-progressie-boom',
    templateUrl: './progressie-boom.component.html',
    styleUrls: ['./progressie-boom.component.scss']
})

export class ProgressieBoomComponent implements OnInit, OnDestroy {
    @Input() VliegerID: number;
    @ViewChild(ModalComponent) private bevestigPopup: ModalComponent;

    private dbEventAbonnement: Subscription;
    private competentiesAbonnement: Subscription;
    boom: ProgressieTreeviewItemComponent[];

    competenties: HeliosCompetentiesDataset[];
    values: number[];
    suspend: boolean = false;
    isDisabled: boolean = true;

    config = TreeviewConfig.create({
        hasAllCheckBox: false,
        hasFilter: true,
        hasCollapseExpand: true,
        decoupleChildFromParent: false,
        maxHeight: 400
    });

    verwijderCompetentie: ProgressieTreeviewItemComponent;
    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly loginService: LoginService,
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

        const ui = this.loginService.userInfo?.Userinfo;
        this.isDisabled = !(ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) || (this.VliegerID == this.loginService.userInfo?.LidData?.ID);
        this.ophalen();
    }

    ngOnDestroy(): void {
        if (this.dbEventAbonnement)         this.dbEventAbonnement.unsubscribe();
        if (this.competentiesAbonnement)    this.competentiesAbonnement.unsubscribe();
    }

    ophalen(): void {
        this.progressieService.getBoom(this.VliegerID).then((b) => {
            this.boom = [];
            for (let i = 0; i < b.length; i++) {
                this.boom.push(this.TreeView(b[i]))
            }
        });
    }

    TreeView(boomTak: HeliosProgressieBoom): ProgressieTreeviewItemComponent {
        let tekst: string = ''

        if (boomTak.BLOK)
            tekst += boomTak.BLOK.toString();

        tekst += ' ';

        if (boomTak.ONDERWERP)
            tekst += boomTak.ONDERWERP.toString()

        let nieuwetak = new ProgressieTreeviewItemComponent({
            text: (tekst).trim(),
            value: boomTak.COMPETENTIE_ID,

            collapsed: true
        });

        if (!boomTak.children) {
            nieuwetak.checked = boomTak.IS_BEHAALD == 2
            if (nieuwetak.checked) {
                const datum = this.sharedService.datumDMJ(boomTak.INGEVOERD!.substr(0, 10))

                nieuwetak.Instructeur = boomTak.INSTRUCTEUR_NAAM!;
                nieuwetak.ProgresssieID = boomTak.PROGRESSIE_ID!;
                nieuwetak.Behaald = datum;
            }
        } else {
            for (let i = 0; i < boomTak.children.length; i++) {
                const extraTak: TreeviewItem = this.TreeView(boomTak.children[i]);   // recursion

                if (!nieuwetak.children) {
                    nieuwetak.children = [extraTak];  // creeer object en vullen
                } else {
                    nieuwetak.children.push(extraTak);  // voeg toe aan bestaand array
                }
            }
        }
        nieuwetak.correctChecked();
        return nieuwetak;
    }

    onProgressieChange(item: ProgressieTreeviewItemComponent) {

        if (this.isDisabled) {
            return;
        }

        try {
            const ui = this.loginService.userInfo?.LidData;

            if (item.ProgresssieID) {
                this.verwijderCompetentie = item

                this.bevestigPopup.open();
            } else {
                this.uitstellen();
                this.progressieService.behaaldeCompetentie({
                    LID_ID: this.VliegerID,
                    INSTRUCTEUR_ID: ui?.ID,
                    COMPETENTIE_ID: item.value,
                }).then((h: HeliosProgressie) => {
                    item.ProgresssieID = h.ID

                    const c = this.competenties.find((c) => c.ID == h.COMPETENTIE_ID);

                    this.success =
                    {
                        titel: "Progressie",
                        beschrijving: "Competentie '" + c!.ONDERWERP  +"' behaald"
                    }
                });

                const now = new Date()

                item.checked = true;
                item.Behaald = now.getDate() + "-" + now.getMonth() + '-' + now.getFullYear();
                item.Instructeur = ui?.NAAM!;
                item.ProgresssieID = -1;
            }
        } catch (e) {
            this.error = e;
        }
    }


    verwijderenProgressie(item: ProgressieTreeviewItemComponent): void {
        this.bevestigPopup.close();
        this.progressieService.verwijderCompetentie(item.ProgresssieID!);

        item.checked = false;
        item.Behaald = undefined;
        item.Instructeur = undefined;
        item.ProgresssieID = undefined;

        this.uitstellen();
    }

    // Zorg ervoor dat we niet gaan laden
    uitstellen(): void {
        this.suspend = true;
        setTimeout(() => this.suspend = false, 1000);
    }
}
