import {Component, OnDestroy, OnInit, inject, viewChild} from '@angular/core';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {faCaretSquareDown, faCaretSquareUp, faGraduationCap, faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import {Subscription} from 'rxjs';
import {HeliosCompetentie, HeliosCompetentiesDataset, HeliosCompetentiesBoom} from '../../../types/Helios';
import {SharedService} from '../../../services/shared/shared.service';
import {ErrorMessage, InfoMessage} from '../../../types/Utils';
import {ErrorComponent} from '../../../shared/components/error/error.component';
import {InfoComponent} from '../../../shared/components/info/info.component';
import {CompetentieService} from '../../../services/apiservice/competentie.service';
import {
   ITreeOptions,
   TreeNode,
   TreeComponent,
   TreeNodeExpanderComponent,
   TreeDragDirective,
   TreeDropDirective,
   TreeNodeContent
} from '@ali-hm/angular-tree-component';
import {
   CompetentieEditorComponent,
} from '../../../shared/components/editors/competentie-editor/competentie-editor.component';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

import {PegasusCardComponent} from '../../../shared/components/pegasus-card/pegasus-card.component';

export interface CompetentieTreeviewItem
{
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
   host: {class: 'scherm-pagina'},
   templateUrl: './competenties-page.component.html',
   styleUrls: ['./competenties-page.component.scss'],
   imports: [CompetentieEditorComponent, ErrorComponent, InfoComponent, PegasusCardComponent, TreeComponent, TreeNodeExpanderComponent, TreeDragDirective, TreeDropDirective, TreeNodeContent, FaIconComponent]
})
export class CompetentiesPageComponent implements OnInit, OnDestroy
{
   // variablen in html formulier
   protected readonly editor = viewChild.required(CompetentieEditorComponent);

   protected iconCardIcon: IconDefinition = faGraduationCap;
   protected toevoegenIcon: IconDefinition = faPlusCircle;
   protected upIcon: IconDefinition = faCaretSquareUp;
   protected downIcon: IconDefinition = faCaretSquareDown;
   protected competenties: HeliosCompetentiesDataset[];
   protected boom: CompetentieTreeviewItem[] = [];
   protected error: ErrorMessage | undefined;
   protected info: InfoMessage | undefined;
   protected treeOptions: ITreeOptions = {
      idField: 'nodeId',
      displayField: 'text',
      childrenField: 'children',
      isExpandedField: 'expanded', // slepen: alleen competenties, een leerfase ligt vast (die is een type)
      allowDrag: (node: TreeNode) => !!node.data.competentieID,  // neerzetten: alleen binnen dezelfde leerfase
      allowDrop: (element: TreeNode, to: { parent: TreeNode }) => this.magNeerzetten(element, to.parent),
   };

   // private variable voor ts script
   private readonly sharedService = inject(SharedService);
   private readonly competentieService = inject(CompetentieService);

   private dbEventAbonnement: Subscription;        // Abonneer op aanpassingen in de database
   private competentiesAbonnement: Subscription;
   private volgordeOpslaan = false;    // tijdens het opslaan van de volgorde niet bij elke update opnieuw ophalen

   ngOnInit(): void
   {
      // abonneer op wijziging van competenties
      this.competentiesAbonnement = this.competentieService.competentiesChange.subscribe(dataset =>
      {
         this.competenties = dataset!;
         this.opvragen();
      });

      // Als type is aangepast, moeten we grid opnieuw laden
      this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev =>
      {
         if ((ev.tabel == "Competenties") && (!this.volgordeOpslaan))
         {
            this.opvragen();
         }
      });
   }

   ngOnDestroy(): void
   {
      if (this.competentiesAbonnement) this.competentiesAbonnement.unsubscribe();
      if (this.dbEventAbonnement) this.dbEventAbonnement.unsubscribe();
   }

   // ophalen van de boomstructuur van competenties, en omzetten naar de structuur die de boomcomponent verwacht
   private opvragen(): void
   {
      this.competentieService.getBoom().then((boom) =>
      {
         const tree: CompetentieTreeviewItem[] = [];
         for (const item of boom)
         {
            const t = this.TreeView(item);
            t.blokID = -1;                    // indicatie dat het top level item is
            tree.push(t)
         }
         this.boom = tree;
      }).catch(e => this.error = e);
   }

   // Recursieve functie die een tak van de Helios boom omzet naar een tak van de Treeview boom. De Helios boom heeft
   // een andere structuur dan de Treeview boom, en de Treeview boom heeft extra velden nodig (leerfaseID, blok, blokID,
   // competentieID) die niet in de Helios boom zitten. De Helios boom heeft ook een wortel (leerfase) met ID -1, en de
   // competenties direct onder de wortel hebben OUDER_ID -1. De Treeview boom heeft geen wortel, en de competenties
   // direct onder de wortel hebben blokID null.
   private TreeView(boomTak: HeliosCompetentiesBoom): CompetentieTreeviewItem
   {
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

      if (boomTak.children)
      {
         for (const item of boomTak.children)
         {
            const extraTak: CompetentieTreeviewItem = this.TreeView(item);   // recursion

            nieuwetak.children = [...(nieuwetak.children ?? []), extraTak];
         }
      }
      return nieuwetak;
   }

   // Nieuwe competentie onder de parent (een leerfase of een competentie): opent direct de editor.
   // De nieuwe competentie komt achteraan bij de broers en zussen (zelfde ouder in dezelfde leerfase): hoogste
   // VOLGORDE + 1. Niet het aantal + 1, de nummering heeft gaten (bv. 45, 46 direct onder een leerfase)
   protected toevoegen(parent: CompetentieTreeviewItem)
   {
      const ouderID = parent.competentieID ?? null;      // null = direct onder de leerfase
      const broers = this.competenties.filter(c =>
         c.LEERFASE_ID == parent.leerfaseID && (c.OUDER_ID ?? null) == ouderID);
      const hoogste = Math.max(0, ...broers.map(c => c.VOLGORDE ?? 0));

      const competentie: HeliosCompetentie = {
         OUDER_ID: ouderID,
         BLOK: parent.blok,
         LEERFASE_ID: parent.leerfaseID,
         VOLGORDE: hoogste + 1
      }
      this.editor().openPopup(competentie);
   }

   // open de editor in popup voor een bestaande competentie. Een leerfase (hoogste niveau) is geen competentie maar
   // een type uit de groep Opleidingsblok, die wordt in de type editor aangepast
   protected openEditor(item: CompetentieTreeviewItem)
   {
      if (!item.competentieID)
      {
         this.info = {
            titel: 'Leerfase aanpassen',
            beschrijving: `"${item.text}" is een leerfase. Pas deze aan via Types, groep Opleidingsblok.`
         };
         return;
      }

      const competentie = this.competenties?.find(c => c.ID == item.competentieID);    // nog niet geladen: niets doen
      if (competentie)
      {
         this.editor().openPopup(competentie);
      }
   }

   // Verplaats een competentie één plek omlaag of omhoog binnen zijn blok, door de plek te wisselen met de buurman.
   protected omlaag(item: CompetentieTreeviewItem)
   {
      this.verplaats(item, 1);
   }

   // Verplaats een competentie één plek omhoog binnen zijn blok, door de plek te wisselen met de buurman.
   protected omhoog(item: CompetentieTreeviewItem)
   {
      this.verplaats(item, -1);
   }

   // Een competentie is in de boom versleept (naar een andere plek of een andere ouder in dezelfde leerfase).
   // De boom heeft de children arrays al aangepast. Wij zetten OUDER_ID van de versleepte competentie en nummeren
   // VOLGORDE in het oude en het nieuwe blok opnieuw 1, 2, 3, ... zodat die uniek is binnen het blok.
   // Alleen records die echt veranderen gaan naar de server
   protected naVerslepen(event: {
      node: CompetentieTreeviewItem,
      to: { parent: CompetentieTreeviewItem },
      from: { parent: CompetentieTreeviewItem }
   })
   {
      const gewijzigd = new Set<HeliosCompetentiesDataset>();

      const versleept = this.competenties.find(c => c.ID == event.node.competentieID);
      if (!versleept)
      {
         return;
      }

      const nieuweOuder = event.to.parent.competentieID ?? null;     // null = direct onder de leerfase
      if ((versleept.OUDER_ID ?? null) != nieuweOuder)
      {
         versleept.OUDER_ID = nieuweOuder;
         gewijzigd.add(versleept);
      }

      for (const ouder of new Set([event.from.parent, event.to.parent]))
      {
         (ouder.children ?? []).forEach((tak, i) =>
         {
            const competentie = this.competenties.find(c => c.ID == tak.competentieID);
            if (competentie && competentie.VOLGORDE !== i + 1)
            {
               competentie.VOLGORDE = i + 1;
               gewijzigd.add(competentie);
            }
         });
      }

      this.opslaanVolgorde([...gewijzigd]);
   }

   // Bovenste competentie onder zijn ouder, kan niet verder omhoog. Een eenling is zowel de eerste als de laatste
   protected isEerste(node: TreeNode): boolean
   {
      return this.broers(node)[0] === node;
   }

   // Onderste competentie onder zijn ouder, kan niet verder omlaag
   protected isLaatste(node: TreeNode): boolean
   {
      const broers = this.broers(node);
      return broers[broers.length - 1] === node;
   }

   // Verplaats een competentie één plek omlaag (+1) of omhoog (-1) binnen zijn blok, door de plek te wisselen met de
   // buurman. Alleen records waarvan VOLGORDE echt verandert gaan naar de server, normaal zijn dat er twee. Zitten er
   // gaten of dubbele nummers in de volgorde, dan worden die meteen rechtgezet (dan eenmalig meer records)
   private verplaats(item: CompetentieTreeviewItem, richting: 1 | -1)
   {
      const competentie = this.competenties.find(c => c.ID == item.value);
      if (!competentie)
      {
         return;
      }

      // broers en zussen: dezelfde ouder in dezelfde leerfase, zo bouwt Helios.js ook de boom op.
      // Niet op BLOK filteren, dat is het syllabusnummer van één competentie (bv. 25.1)
      const blok = this.competenties
         .filter(c => c.LEERFASE_ID == competentie.LEERFASE_ID && (c.OUDER_ID ?? null) == (competentie.OUDER_ID ?? null))
         .sort((a, b) => (a.VOLGORDE ?? 0) - (b.VOLGORDE ?? 0));

      const idx = blok.findIndex(c => c.ID == competentie.ID);
      const buur = idx + richting;
      if (buur < 0 || buur >= blok.length)
      {
         return;     // staat al bovenaan of onderaan
      }

      // Omwisselen van de twee records in het blok, zodat de volgorde klopt.
      // Daarna alle records in het blok langsgaan en VOLGORDE aanpassen als dat niet klopt
      const t = blok[idx];
      blok[idx] = blok[buur];
      blok[buur] = t;

      const gewijzigd: HeliosCompetentiesDataset[] = [];
      blok.forEach((c, i) =>
      {
         if (c.VOLGORDE !== i + 1)
         {
            c.VOLGORDE = i + 1;
            gewijzigd.push(c);
         }
      });

      this.opslaanVolgorde(gewijzigd);
   }

   // Neerzetten mag alleen binnen dezelfde leerfase. Een leerfase zelf is geen geldige plek op het hoogste niveau
   // (de onzichtbare wortel heeft geen leerfase). In zichzelf of een eigen kind neerzetten weigert de boom zelf al
   private magNeerzetten(element: TreeNode | undefined, ouder: TreeNode | undefined): boolean
   {
      if (!element?.data || !ouder?.data)
      {
         return false;
      }
      return ouder.data.leerfaseID !== undefined && ouder.data.leerfaseID === element.data.leerfaseID;
   }

   // Sla gewijzigde VOLGORDE / OUDER_ID op. Iedere update vuurt een Competenties event af, dat zou de boom per record
   // opnieuw ophalen. Daarom staat dat tijdens het opslaan uit en halen we na afloop één keer op
   private opslaanVolgorde(gewijzigd: HeliosCompetentiesDataset[])
   {
      if (gewijzigd.length === 0)
      {
         return;
      }

      this.volgordeOpslaan = true;
      Promise.all(gewijzigd.map(c => this.competentieService.updateCompetentie(c)))
         .catch(e => this.error = e)
         .finally(() =>
         {
            this.volgordeOpslaan = false;
            this.opvragen();
         });
   }

   // De competenties onder dezelfde ouder, in de volgorde van de boom
   private broers(node: TreeNode): TreeNode[]
   {
      return node.parent?.children ?? [];
   }
}
