import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {TreeviewConfig, TreeviewItem} from 'ngx-treeview2';
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {HeliosCompetentiesDataset, HeliosProgressieBoom, HeliosType} from "../../../types/Helios";
import {LoginService} from "../../../services/apiservice/login.service";
import {ErrorMessage, HeliosActie, SuccessMessage} from "../../../types/Utils";
import {SharedService} from "../../../services/shared/shared.service";
import {CompetentieService} from "../../../services/apiservice/competentie.service";
import {Subscription} from "rxjs";
import {ProgressieEditorComponent} from "../editors/progressie-editor/progressie-editor.component";
import {TypesService} from "../../../services/apiservice/types.service";

export class ProgressieTreeviewItem extends TreeviewItem {
    ProgresssieID: number | undefined;
    Instructeur: string | undefined;
    Behaald: string | undefined;
    Score: number | undefined;
    GeldigTot: string | undefined;
}

@Component({
    selector: 'app-progressie-boom',
    templateUrl: './progressie-boom.component.html',
    styleUrls: ['./progressie-boom.component.scss']
})

export class ProgressieBoomComponent implements OnInit, OnDestroy, OnChanges {
    @Input() VliegerID: number;
    @ViewChild(ProgressieEditorComponent) private editor: ProgressieEditorComponent;

    private dbEventAbonnement: Subscription;
    private competentiesAbonnement: Subscription;
    boom: ProgressieTreeviewItem[];

    private typesAbonnement: Subscription;
    opleidingBlok: HeliosType[];         // welke opleidingen hebben we

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

    verwijderCompetentie: ProgressieTreeviewItem;
    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly loginService: LoginService,
                private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly competentieService: CompetentieService,
                private readonly progressieService: ProgressieService) {
    }

    ngOnInit(): void {
        // abonneer op wijziging van types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.opleidingBlok = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 10
            });
        })

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

        this.ophalen();
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
        if (this.dbEventAbonnement) this.dbEventAbonnement.unsubscribe();
        if (this.competentiesAbonnement) this.competentiesAbonnement.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty("VliegerID")) {
            this.ophalen();
        }
    }

    ophalen(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.isDisabled = !(ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) || (this.VliegerID == this.loginService.userInfo?.LidData?.ID);

        this.progressieService.getBoom(this.VliegerID).then((b) => {
            let tree: ProgressieTreeviewItem[] = [];
            for (let i = 0; i < b.length; i++) {
                const tak = this.TreeView(b[i])

                if (this.boom) {
                    // toevoegen van ext ref aan wortel van de boom (komt uit types). in ext_ref staat versie nummer van progressie kaart
                    const blok: HeliosType|undefined = this.opleidingBlok.find((b) => {
                        const txt = (b.CODE) ? b.CODE + ": " +b.OMSCHRIJVING : b.OMSCHRIJVING
                        return txt == tak.text
                    })

                    if (blok && blok.EXT_REF) {
                        tak.text += " (" + blok.EXT_REF +")"
                    }
                    // done

                    // als een tak is uitgeklapt, don moeten we dat zo houden
                    // collapsed is default uit (tak) , zo zet je het weer aan (via this.boom)
                    tak.setCollapsedRecursive(this.boom[i].collapsed)
                }

                tree.push(tak)
            }
            this.boom = tree;
        });
    }

    TreeView(boomTak: HeliosProgressieBoom): ProgressieTreeviewItem {
        let tekst: string = ''

        if (boomTak.BLOK)
            tekst += boomTak.BLOK.toString();

        tekst += ' ';

        if (boomTak.ONDERWERP)
            tekst += boomTak.ONDERWERP.toString()

        let nieuwetak = new ProgressieTreeviewItem({
            text: (tekst).trim(),
            value: boomTak.COMPETENTIE_ID,

            collapsed: true
        });

        if (!boomTak.children) {
            nieuwetak.checked = boomTak.IS_BEHAALD == 2
            if (nieuwetak.checked) {
                const datum = this.sharedService.datumDMJ(boomTak.INGEVOERD!.substring(0, 10))

                nieuwetak.Instructeur = boomTak.INSTRUCTEUR_NAAM!;
                nieuwetak.ProgresssieID = boomTak.PROGRESSIE_ID!;
                nieuwetak.Behaald = datum;
                nieuwetak.Score = boomTak.SCORE;
                nieuwetak.GeldigTot = (boomTak.GELDIG_TOT) ? this.sharedService.datumDMJ(boomTak.GELDIG_TOT) : undefined;
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

    onProgressieChange(item: ProgressieTreeviewItem) {
        if (this.isDisabled) {
            return;
        }

        if (item.ProgresssieID) {
            this.verwijderCompetentie = item

            this.editor.openVerwijderWijzigPopup(item.ProgresssieID);
        } else {
            this.editor.openNieuwPopup(item.value);
        }
    }

    // Zorg ervoor dat we niet gaan laden
    uitstellen(): void {
        this.suspend = true;
        setTimeout(() => this.suspend = false, 1000);
    }
}
