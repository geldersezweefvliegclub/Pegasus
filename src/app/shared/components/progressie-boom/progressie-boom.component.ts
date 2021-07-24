import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {TreeviewItem, TreeviewConfig} from 'ngx-treeview';
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {HeliosBehaaldeProgressie, HeliosProgressie, HeliosProgressieBoom} from "../../../types/Helios";
import {LoginService} from "../../../services/apiservice/login.service";
import {ModalComponent} from "../modal/modal.component";
import {dateISO} from "ng2-validation/dist/date-ios";
import {HeliosActie} from "../../../types/Utils";
import {SharedService} from "../../../services/shared/shared.service";

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

export class ProgressieBoomComponent implements OnInit {
    @Input() VliegerID: number;
    @ViewChild(ModalComponent) private bevestigPopup: ModalComponent;

    boom: ProgressieTreeviewItemComponent[];
    values: number[];
    suspend: boolean = false;

    config = TreeviewConfig.create({
        hasAllCheckBox: false,
        hasFilter: true,
        hasCollapseExpand: true,
        decoupleChildFromParent: false,
        maxHeight: 400
    });

    verwijderCompetentie: ProgressieTreeviewItemComponent;

    constructor(private readonly loginService: LoginService,
                private readonly sharedService: SharedService,
                private readonly progressieService: ProgressieService) {

        // Als in de progressie tabel is aangepast, moet we onze dataset ook aanpassen
        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Progressie") {
                if (!this.suspend && (ev.actie == HeliosActie.Add || ev.actie == HeliosActie.Delete)) {
                    this.ophalen();
                }
            }
        });
    }

    ngOnInit(): void {
        this.ophalen();
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
        let nieuwetak = new ProgressieTreeviewItemComponent({
            text: boomTak.ONDERWERP!.toString(),
            value: boomTak.COMPETENTIE_ID,

            collapsed: true
        });

        if (!boomTak.children) {
            nieuwetak.checked = boomTak.IS_BEHAALD == 2
            if (nieuwetak.checked) {
                const dateParts: string[] = boomTak.INGEVOERD!.substr(0, 10).split('-');
                const datum = dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0];

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
            }).then((h: HeliosProgressie) => item.ProgresssieID = h.ID);

            const now = new Date()

            item.checked = true;
            item.Behaald = now.getDate() + "-" + now.getMonth() + '-' + now.getFullYear();
            item.Instructeur = ui?.NAAM!;
            item.ProgresssieID = -1;
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
