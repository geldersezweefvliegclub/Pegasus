import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faCaretSquareDown, faCaretSquareUp, faGraduationCap, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { HeliosCompetentie, HeliosCompetentiesDataset, HeliosProgressieBoom, HeliosType } from '../../../types/Helios';
import { SharedService } from '../../../services/shared/shared.service';
import { CompetentieService } from '../../../services/apiservice/competentie.service';
import { TreeviewConfig, TreeviewItem } from 'ngx-treeview2';
import { LoginService } from '../../../services/apiservice/login.service';
import { TypesService } from '../../../services/apiservice/types.service';
import {
  CompetentieEditorComponent,
} from '../../../shared/components/editors/competentie-editor/competentie-editor.component';

export class CompetentieTreeviewItem extends TreeviewItem {
    leerfaseID: number | undefined;
    blokID: number | undefined;
    competentieID: number | undefined;
}

@Component({
    selector: 'app-competenties-page',
    templateUrl: './competenties-page.component.html',
    styleUrls: ['./competenties-page.component.scss']
})
export class CompetentiesPageComponent implements OnInit, OnDestroy {
    @ViewChild(CompetentieEditorComponent) editor: CompetentieEditorComponent;

    iconCardIcon: IconDefinition = faGraduationCap;
    toevoegenIcon: IconDefinition = faPlusCircle;
    upIcon: IconDefinition = faCaretSquareUp;
    downIcon: IconDefinition = faCaretSquareDown;

    private dbEventAbonnement: Subscription;        // Abonneer op aanpassingen in de database
    private competentiesAbonnement: Subscription;
    competenties: HeliosCompetentiesDataset[];
    boom: CompetentieTreeviewItem[];

    isLoading = false;
    isSuspended = false;
    private typesAbonnement: Subscription;
    leerfaseTypes: HeliosType[];

    config = TreeviewConfig.create({
        hasAllCheckBox: false,
        hasFilter: false,
        hasCollapseExpand: false,
        decoupleChildFromParent: true,
    });

    constructor(private readonly loginService: LoginService,
                private readonly sharedService: SharedService,
                private readonly typesService: TypesService,
                private readonly competentieService: CompetentieService) {
    }

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

    TreeView(boomTak: HeliosProgressieBoom): CompetentieTreeviewItem {
        let tekst = ''

        if (boomTak.BLOK)
            tekst += boomTak.BLOK.toString();

        tekst += " ";
        if (boomTak.ONDERWERP)
            tekst += boomTak.ONDERWERP.toString()

        const nieuwetak = new CompetentieTreeviewItem({
            text: (tekst).trim(),
            value: boomTak.COMPETENTIE_ID,
            checked: false,
            collapsed: false
        });
        nieuwetak.blokID = boomTak.BLOK_ID;
        nieuwetak.leerfaseID = boomTak.LEERFASE_ID;
        nieuwetak.competentieID = boomTak.COMPETENTIE_ID;

        if (boomTak.children) {
            for (const item of boomTak.children) {
                const extraTak: CompetentieTreeviewItem  = this.TreeView(item);   // recursion

                if (!nieuwetak.children) {
                    nieuwetak.children = [extraTak];  // creeer object en vullen
                } else {
                    nieuwetak.children.push(extraTak);  // voeg toe aan bestaand array
                }
            }
        }
        return nieuwetak;
    }

    // Het toevoegen van een competentie
    toevoegen(parent: CompetentieTreeviewItem) {
        this.boom.forEach((boomtak) => {
            this.nieuweBoomTak(boomtak, parent.value);
        })
    }

    // insert een nieuwe tak in de boom
    nieuweBoomTak(boomTak: CompetentieTreeviewItem, parentID: number) {
        // toevoegen van de tak onder de parent
        if (boomTak.competentieID == parentID) {
            const nieuwetak = new CompetentieTreeviewItem({
                text: "<< nieuwe competentie >>",
                value: -1,
                checked: false,
                collapsed: false
            });
            nieuwetak.blokID = boomTak.competentieID;
            nieuwetak.leerfaseID = boomTak.leerfaseID;
            nieuwetak.competentieID = undefined;

            if (boomTak.children) {                     // voeg item toe aan bestaande kinderder
                boomTak.children.push(nieuwetak)
            }
            else {
                boomTak.children = [nieuwetak]          // nieuwe kinderen
            }
            return
        }

        // We gaan dieper de boom in om te kijken of daar toegevoegd moet worden
        if (boomTak.children) {
            for (const item of boomTak.children) {
                this.nieuweBoomTak(item as CompetentieTreeviewItem, parentID);
            }
        }
    }

    // open de editor in popup
    openEditor(item: CompetentieTreeviewItem) {
        if (!item.competentieID) {
            const children = this.competenties.filter(c => c.BLOK_ID == item.blokID)

            const c: HeliosCompetentie = {
                BLOK_ID: item.blokID,
                LEERFASE_ID: item.leerfaseID,
                VOLGORDE: children.length
            }
            this.editor.openPopup(c);
        }
        else {
            const competentie = this.competenties.find(c => c.ID == item.competentieID)
            this.editor.openPopup(competentie!);
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
            const children: HeliosCompetentiesDataset[] = this.competenties.filter(c => c.BLOK_ID == competentie.BLOK_ID)

            // hernummer de volgorde. Er mogen geen gaten aanwezig zijn
            children.sort(function(a, b) {
                return a.VOLGORDE! - b.VOLGORDE!});
            for (let i=0 ; i < children.length ; i++) {
                children[i].VOLGORDE = i+1;
            }
            // gedaan

            const idx = children.findIndex((c: HeliosCompetentiesDataset) => { return c.ID == competentieID })

            if (idx < children.length) {     // bij einde is er niets meer te doen
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
            const children: HeliosCompetentiesDataset[] = this.competenties.filter(c => c.BLOK_ID == competentie.BLOK_ID)

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
