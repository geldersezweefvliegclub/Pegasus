import { Component, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, input, viewChild } from '@angular/core';
import { ITreeOptions, ITreeState, TreeComponent } from '@ali-hm/angular-tree-component';
import { ProgressieService } from '../../../services/apiservice/progressie.service';
import { HeliosCompetentiesDataset, HeliosProgressieBoom, HeliosType } from '../../../types/Helios';
import { LoginService } from '../../../services/apiservice/login.service';
import { ErrorMessage, HeliosActie, SuccessMessage } from '../../../types/Utils';
import { SharedService } from '../../../services/shared/shared.service';
import { CompetentieService } from '../../../services/apiservice/competentie.service';
import { Subscription } from 'rxjs';
import { ProgressieEditorComponent } from '../editors/progressie-editor/progressie-editor.component';
import { TypesService } from '../../../services/apiservice/types.service';
import { ErrorComponent } from '../error/error.component';
import { SuccessComponent } from '../success/success.component';
import { FormsModule } from '@angular/forms';

import { VoortgangComponent } from '../voortgang/voortgang.component';

export interface ProgressieTreeviewItem {
    nodeId: string;
    text: string;
    value: number | undefined;
    expanded: boolean;
    children?: ProgressieTreeviewItem[];
    ProgresssieID: number | undefined;
    Instructeur: string | undefined;
    Behaald: string | undefined;
    Score: number | undefined;
    GeldigTot: string | undefined;
    IsBehaald: number | undefined;
}

@Component({
    selector: 'app-progressie-boom',
    templateUrl: './progressie-boom.component.html',
    styleUrls: ['./progressie-boom.component.scss'],
    imports: [ErrorComponent, SuccessComponent, FormsModule, TreeComponent, VoortgangComponent, ProgressieEditorComponent]
})

export class ProgressieBoomComponent implements OnInit, OnDestroy, OnChanges {
    private readonly loginService = inject(LoginService);
    private readonly typesService = inject(TypesService);
    private readonly sharedService = inject(SharedService);
    private readonly competentieService = inject(CompetentieService);
    private readonly progressieService = inject(ProgressieService);

    readonly VliegerID = input.required<number>();
    private readonly editor = viewChild.required(ProgressieEditorComponent);
    private readonly progressieTree = viewChild<TreeComponent>('progressieTree');

    private dbEventAbonnement: Subscription;
    private competentiesAbonnement: Subscription;
    boom: ProgressieTreeviewItem[] = [];

    private typesAbonnement: Subscription;
    opleidingBlok: HeliosType[];         // welke opleidingen hebben we

    competenties: HeliosCompetentiesDataset[];
    values: number[];
    suspend = false;
    isDisabled = true;

    treeOptions: ITreeOptions = {
        idField: 'nodeId',
        displayField: 'text',
        childrenField: 'children',
        isExpandedField: 'expanded',
    };
    treeState: ITreeState = {};
    filterText = '';

    verwijderCompetentie: ProgressieTreeviewItem;
    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

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
        if (Object.prototype.hasOwnProperty.call(changes, "VliegerID")) {
            this.ophalen();
        }
    }

    ophalen(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.isDisabled = !(ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) || (this.VliegerID() == this.loginService.userInfo?.LidData?.ID);
        this.treeState = this.progressieTree()?.treeModel.getState() ?? this.treeState;

        this.progressieService.getBoom(this.VliegerID()).then((b) => {
            const tree: ProgressieTreeviewItem[] = [];
            for (let i = 0; i < b.length; i++) {
                const tak = this.TreeView(b[i], `root-${i}`);

                if (this.opleidingBlok) {
                    // de wortel van de boom is het opleidingsblok (komt uit types). Helios.js geeft alleen de omschrijving,
                    // de code zetten we ervoor. In ext_ref staat versie nummer van progressie kaart
                    const blok: HeliosType|undefined = this.opleidingBlok.find((t) => t.ID == b[i].LEERFASE_ID)

                    if (blok && blok.CODE) {
                        tak.text = blok.CODE + ": " + tak.text
                    }
                    if (blok && blok.EXT_REF) {
                        tak.text += " (" + blok.EXT_REF +")"
                    }
                }

                tree.push(tak)
            }
            this.boom = tree;
            setTimeout(() => this.applyFilter());
        });
    }

    TreeView(boomTak: HeliosProgressieBoom, nodeId: string): ProgressieTreeviewItem {
        let tekst = ''

        if (boomTak.BLOK)
            tekst += boomTak.BLOK.toString();

        tekst += ' ';

        if (boomTak.OMSCHRIJVING)
            tekst += boomTak.OMSCHRIJVING.toString()

        const nieuwetak: ProgressieTreeviewItem = {
            nodeId,
            text: (tekst).trim(),
            value: (boomTak.ID === -1) ? undefined : boomTak.ID,       // Helios.js geeft de wortel (leerfase) ID -1
            expanded: false,
            ProgresssieID: undefined,
            Instructeur: undefined,
            Behaald: undefined,
            Score: undefined,
            GeldigTot: undefined,
            IsBehaald: undefined,
        };

        // Helios.js geeft een blad een lege children array
        if (!boomTak.children?.length) {
            const datum = boomTak.INGEVOERD ? this.sharedService.datumDMJ(boomTak.INGEVOERD!.substring(0, 10)) : undefined;

            nieuwetak.Instructeur = boomTak.INSTRUCTEUR_NAAM!;
            nieuwetak.ProgresssieID = boomTak.PROGRESSIE_ID!;
            nieuwetak.Behaald = datum;
            nieuwetak.Score = boomTak.SCORE ?? undefined;
            nieuwetak.GeldigTot = (boomTak.GELDIG_TOT) ? this.sharedService.datumDMJ(boomTak.GELDIG_TOT) : undefined;
            nieuwetak.IsBehaald = (boomTak.PROGRESSIE_ID) ? 2 : 0;
        } else {
            for (let index = 0; index < boomTak.children.length; index++) {
                const item = boomTak.children[index];
                const extraTak = this.TreeView(item, `${nodeId}-${index}`);   // recursion
                nieuwetak.children = [...(nieuwetak.children ?? []), extraTak];
            }
            nieuwetak.IsBehaald = this.isBehaald(nieuwetak.children!);
        }
        return nieuwetak;
    }

    // 0 = niets behaald, 1 = gedeeltelijk behaald, 2 = alles behaald (zat in PHP in Boom::isBehaald)
    private isBehaald(children: ProgressieTreeviewItem[]): number {
        if (children.some((c) => c.IsBehaald === 1)) return 1;

        const behaald = children.filter((c) => c.IsBehaald === 2).length;
        if (behaald === 0) return 0;
        return (behaald === children.length) ? 2 : 1;
    }

    onProgressieChange(item: ProgressieTreeviewItem) {
        if (this.isDisabled) {
            return;
        }

        if (item.ProgresssieID) {
            this.verwijderCompetentie = item

            this.editor().openVerwijderWijzigPopup(item.ProgresssieID);
        } else if (item.value !== undefined) {
            this.editor().openNieuwPopup(item.value);
        }
    }

    // Zorg ervoor dat we niet gaan laden
    uitstellen(): void {
        this.suspend = true;
        setTimeout(() => this.suspend = false, 1000);
    }

    onFilterChange(value: string): void {
        this.filterText = value;
        this.applyFilter();
    }

    onTreeStateChange(state: ITreeState): void {
        this.treeState = state;
    }

    private applyFilter(): void {
        const progressieTree = this.progressieTree();
        if (!progressieTree?.treeModel) {
            return;
        }

        const filter = this.filterText.trim();
        if (filter.length > 0) {
            progressieTree.treeModel.filterNodes(filter, true);
            return;
        }

        progressieTree.treeModel.clearFilter();
    }
}
