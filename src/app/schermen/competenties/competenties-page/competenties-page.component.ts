import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faCaretSquareDown, faCaretSquareUp, faGraduationCap, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { HeliosCompetentie, HeliosCompetentiesDataset, HeliosCompetentiesBoom, HeliosType } from '../../../types/Helios';
import { SharedService } from '../../../services/shared/shared.service';
import { CompetentieService } from '../../../services/apiservice/competentie.service';
import { ITreeOptions, TreeComponent, TreeNodeExpanderComponent, TreeDragDirective, TreeDropDirective, TreeNodeContent } from '@ali-hm/angular-tree-component';
import { TypesService } from '../../../services/apiservice/types.service';
import {
  CompetentieEditorComponent,
} from '../../../shared/components/editors/competentie-editor/competentie-editor.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';

export interface CompetentieTreeviewItem {
    nodeId: string;
    text: string;
    value: number | null | undefined;
    expanded: boolean;
    children?: CompetentieTreeviewItem[];
    leerfaseID: number | undefined;
    blok: string | undefined;
    blokID: number | null | undefined;
    competentieID: number | null | undefined;
}

@Component({
    selector: 'app-competenties-page',
    templateUrl: './competenties-page.component.html',
    styleUrls: ['./competenties-page.component.scss'],
    imports: [CompetentieEditorComponent, PegasusCardComponent, TreeComponent, TreeNodeExpanderComponent, TreeDragDirective, TreeDropDirective, TreeNodeContent, FaIconComponent]
})
export class CompetentiesPageComponent implements OnInit, OnDestroy {
    private readonly sharedService = inject(SharedService);
    private readonly typesService = inject(TypesService);
    private readonly competentieService = inject(CompetentieService);

    readonly editor = viewChild.required(CompetentieEditorComponent);

    iconCardIcon: IconDefinition = faGraduationCap;
    toevoegenIcon: IconDefinition = faPlusCircle;
    upIcon: IconDefinition = faCaretSquareUp;
    downIcon: IconDefinition = faCaretSquareDown;

    private dbEventAbonnement: Subscription;        // Abonneer op aanpassingen in de database
    private competentiesAbonnement: Subscription;
    competenties: HeliosCompetentiesDataset[];
    boom: CompetentieTreeviewItem[] = [];

    isLoading = false;
    isSuspended = false;
    private typesAbonnement: Subscription;
    leerfaseTypes: HeliosType[];

    treeOptions: ITreeOptions = {
        idField: 'nodeId',
        displayField: 'text',
        childrenField: 'children',
        isExpandedField: 'expanded',
    };

    ngOnInit(): void {
        // abonneer op wijziging van vliegtuigTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.leerfaseTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 10});
        });

        // abonneer op wijziging van competenties
        this.competentiesAbonnement = this.competentieService.competentiesChange.subscribe(dataset => {
            this.competenties = dataset!;

            this.opvragen();
        });

        // Als type is aangepast, moeten we grid opnieuw laden
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if ((ev.tabel == "Competenties") && (!this.isSuspended)){
                this.opvragen();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.competentiesAbonnement) this.competentiesAbonnement.unsubscribe();
        if (this.dbEventAbonnement) this.dbEventAbonnement.unsubscribe();
    }

    opvragen(): void {
        this.isLoading = true;
        this.competentieService.getBoom().then((boom) => {
            const tree: CompetentieTreeviewItem[] = [];
            for (const item of boom) {
                const t = this.TreeView(item);
                t.blokID = -1;                    // indicatie dat het top level item is
                tree.push(t)
            }
            this.boom = tree;
            this.isLoading = false;
        }).catch(() => this.isLoading = false);
    }

    TreeView(boomTak: HeliosCompetentiesBoom): CompetentieTreeviewItem {
        let tekst = ''

        if (boomTak.BLOK)
            tekst += boomTak.BLOK.toString();

        tekst += " ";
        if (boomTak.OMSCHRIJVING)
            tekst += boomTak.OMSCHRIJVING.toString()

        // Helios.js geeft de wortel (leerfase) ID -1, en de competenties direct onder de wortel OUDER_ID -1
        const competentieID = (boomTak.ID === -1) ? null : boomTak.ID;
        const nieuwetak: CompetentieTreeviewItem = {
            nodeId: (competentieID === null) ? `leerfase-${boomTak.LEERFASE_ID}` : `competentie-${competentieID}`,
            text: (tekst).trim(),
            value: competentieID,
            expanded: true,
            leerfaseID: boomTak.LEERFASE_ID,
            blok: boomTak.BLOK ?? undefined,
            blokID: (boomTak.OUDER_ID === -1) ? null : boomTak.OUDER_ID,
            competentieID: competentieID,
        };

        if (boomTak.children) {
            for (const item of boomTak.children) {
                const extraTak: CompetentieTreeviewItem  = this.TreeView(item);   // recursion

                nieuwetak.children = [...(nieuwetak.children ?? []), extraTak];
            }
        }
        return nieuwetak;
    }

    // Het toevoegen van een competentie
    toevoegen(parent: CompetentieTreeviewItem) {
        if (parent.value === undefined) {
            return;
        }
        this.boom.forEach((boomtak) => {
            this.nieuweBoomTak(boomtak, parent.value);
        })
    }

    // insert een nieuwe tak in de boom
    nieuweBoomTak(boomTak: CompetentieTreeviewItem, parentID: number | null | undefined) {
        // toevoegen van de tak onder de parent
        if (boomTak.competentieID == parentID) {
            const nieuwetak: CompetentieTreeviewItem = {
                nodeId: `nieuw-${parentID}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                text: "<< nieuwe competentie >>",
                value: -1,
                expanded: true,
                blok: boomTak.blok,
                blokID: boomTak.competentieID,
                leerfaseID: boomTak.leerfaseID,
                competentieID: undefined,
            };

            boomTak.children = [...(boomTak.children ?? []), nieuwetak];
            return
        }

        // We gaan dieper de boom in om te kijken of daar toegevoegd moet worden
        if (boomTak.children) {
            for (const item of boomTak.children) {
                this.nieuweBoomTak(item, parentID);
            }
        }
    }

    // open de editor in popup
    openEditor(item: CompetentieTreeviewItem) {
        if (!item.competentieID) {
            const children = this.competenties.filter(c => c.BLOK == item.blok)

            const c: HeliosCompetentie = {
                OUDER_ID: item.blokID,
                BLOK: item.blok,
                LEERFASE_ID: item.leerfaseID,
                VOLGORDE: children.length
            }
            this.editor().openPopup(c);
        }
        else {
            const competentie = this.competenties.find(c => c.ID == item.competentieID)
            this.editor().openPopup(competentie!);
        }
    }

    suspend() {
        this.isSuspended = true;
        setTimeout(() => this.isSuspended = false, 1500);
    }


    omlaag(item: CompetentieTreeviewItem) {
        const competentieID = item.value;
        const competentie = this.competenties.find(c => c.ID == competentieID)

        if (competentie) {
            const children: HeliosCompetentiesDataset[] = this.competenties.filter(c => c.BLOK == competentie.BLOK)

            // hernummer de volgorde. Er mogen geen gaten aanwezig zijn
            children.sort((a, b) => a.VOLGORDE! - b.VOLGORDE!);
            for (let i=0 ; i < children.length ; i++) {
                children[i].VOLGORDE = i+1;
            }
            // gedaan

            const idx = children.findIndex((c: HeliosCompetentiesDataset) => { return c.ID == competentieID })

            if (idx < children.length - 1) {     // bij einde is er niets meer te doen
                children[idx].VOLGORDE!++;
                children[idx + 1].VOLGORDE!--;

                this.suspend();
                for (const item1 of children) {
                    this.competentieService.updateCompetentie(item1);
                }
                this.opvragen();
            }
        }
    }

    omhoog(item: CompetentieTreeviewItem) {
        const competentieID = item.value;
        const competentie = this.competenties.find(c => c.ID == competentieID)

        if (competentie) {
            const children: HeliosCompetentiesDataset[] = this.competenties.filter(c => c.BLOK == competentie.BLOK)

            // hernummer de volgorde. Er mogen geen gaten aanwezig zijn
            children.sort(function(a, b) {
                return a.VOLGORDE! - b.VOLGORDE!});
            for (let i=0 ; i < children.length ; i++) {
                children[i].VOLGORDE = i+1;
            }
            // gedaan

            const idx = children.findIndex((c: HeliosCompetentiesDataset) => { return c.ID == competentieID })

            if (idx > 0) {     // bij einde is er niets meer te doen
                children[idx].VOLGORDE!--;
                children[idx - 1].VOLGORDE!++;

                this.suspend();
                for (const item1 of children) {
                    this.competentieService.updateCompetentie(item1).then();
                }
                this.opvragen();
            }
        }
    }
}
