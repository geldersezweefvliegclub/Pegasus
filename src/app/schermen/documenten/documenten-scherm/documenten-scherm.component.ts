import {Component, OnDestroy, OnInit, inject, viewChild} from '@angular/core';
import {faFile, IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {HeliosDocument, HeliosDocumentenDataset, HeliosType} from '../../../types/Helios';
import {ErrorMessage} from '../../../types/Utils';
import {Subscription} from 'rxjs';
import {TypesService} from '../../../services/apiservice/types.service';
import {DocumentenService} from '../../../services/apiservice/documenten.service';
import {
   faCaretSquareDown,
   faCaretSquareUp,
   faMinusCircle,
   faPlusCircle,
   faUndo,
} from '@fortawesome/free-solid-svg-icons';
import {DocumentEditorComponent} from '../../../shared/components/editors/document-editor/document-editor.component';
import {LoginService} from '../../../services/apiservice/login.service';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

import {IconButtonComponent} from '../../../shared/components/icon-button/icon-button.component';
import {PegasusCardComponent} from '../../../shared/components/pegasus-card/pegasus-card.component';
import {StatusButtonComponent} from '../../../shared/components/status-button/status-button.component';
import {ErrorComponent} from '../../../shared/components/error/error.component';

@Component({
   selector: 'app-documenten-scherm',
   host: {class: 'scherm-pagina'},
   templateUrl: './documenten-scherm.component.html',
   styleUrls: ['./documenten-scherm.component.scss'],
   imports: [ErrorComponent, DocumentEditorComponent, IconButtonComponent, PegasusCardComponent, StatusButtonComponent, FaIconComponent]
})
export class DocumentenSchermComponent implements OnInit, OnDestroy
{
   // variablen in html formulier
   protected readonly editor = viewChild.required(DocumentEditorComponent);

   protected iconCardIcon: IconDefinition = faFile;
   protected toevoegenIcon: IconDefinition = faPlusCircle;
   protected deleteIcon: IconDefinition = faMinusCircle;
   protected restoreIcon: IconDefinition = faUndo;
   protected upIcon: IconDefinition = faCaretSquareUp;
   protected downIcon: IconDefinition = faCaretSquareDown;
   protected documentGroepen: HeliosType[] = [];
   protected documenten: HeliosDocumentenDataset[];
   protected editMode = false;          // zitten we in edit mode om documenten te kunnen aanpassen
   protected deleteMode = false;        // zitten we in delete mode om documenten te kunnen verwijderen
   protected trashMode = false;         // zitten in restore mode om documenten te kunnen terughalen
   protected magAanpassen = false;
   protected error: ErrorMessage | undefined;

   // private variable voor ts script
   private readonly typesService = inject(TypesService);
   private readonly loginService = inject(LoginService);
   private readonly documentenService = inject(DocumentenService);

   private typesAbonnement: Subscription;

   ngOnInit(): void
   {
      // abonneer op wijziging van documenten
      this.typesAbonnement = this.typesService.typesChange.subscribe(dataset =>
      {
         this.documentGroepen = dataset!.filter((t: HeliosType) =>
         {
            return t.GROEP == 22;
         });
      });

      this.opvragen();

      // alleen beheerder mag documenten aanpassen
      const ui = this.loginService.userInfo?.Userinfo;
      this.magAanpassen = (ui?.isBeheerder) ?? false;
   }

   ngOnDestroy(): void
   {
      if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
   }

   // ophalen document van de server
   protected opvragen()
   {
      this.documentenService.getDocumenten(this.trashMode).then((docs) => this.documenten = docs);
   }

   protected toonDocumenten(groep: number): HeliosDocumentenDataset[]
   {
      return (!this.documenten) ? [] :
         this.documenten.filter((d: HeliosDocumentenDataset) =>
         {
            return d.GROEP_ID == groep
         });
   }

   // schakelen tussen trashMode JA/NEE. In trashMode worden te verwijderde documenten getoond
   protected trashModeJaNee(actief: boolean)
   {
      this.trashMode = actief

      this.opvragen();
   }

   protected deleteModeJaNee()
   {
      this.deleteMode = !this.deleteMode;

      if (this.trashMode)
      {
         this.trashModeJaNee(false);
      }
   }

   protected delete(id: number)
   {
      const doc = this.documenten.find(d => d.ID == id);

      if (doc)
      {
         this.editor().openVerwijderPopup(doc);
      }
   }

   protected restore(id: number)
   {
      const doc = this.documenten.find(d => d.ID == id);

      if (doc)
      {
         this.editor().openRestorePopup(doc);
      }
   }

   protected aanpassen(id: number)
   {
      const doc = this.documenten.find(d => d.ID == id);

      if (doc)
      {
         this.editor().openPopup(doc);
      }
   }

   protected toevoegen(id: number)
   {
      const doc: HeliosDocument = {
         GROEP_ID: id
      }

      this.editor().openPopup(doc);
   }

   // Verplaats een document één plek omhoog binnen zijn groep, door de plek te wisselen met de buurman
   protected omhoog(id: number)
   {
      this.verplaats(id, -1);
   }

   // Verplaats een document één plek omlaag binnen zijn groep, door de plek te wisselen met de buurman
   protected omlaag(id: number)
   {
      this.verplaats(id, 1);
   }

   protected openUrl(url: string | URL)
   {
      window.open(url);
   }

   // Verplaats een document één plek omlaag (+1) of omhoog (-1) binnen zijn groep, door de plek te wisselen met de
   // buurman. Alleen records waarvan VOLGORDE echt verandert gaan naar de server, normaal zijn dat er twee. Zitten er
   // gaten of dubbele nummers in de volgorde, dan worden die meteen rechtgezet (dan eenmalig meer records)
   private verplaats(id: number, richting: 1 | -1)
   {
      const doc = this.documenten.find(d => d.ID == id);
      if (!doc)
      {
         return;
      }

      const groep = this.documenten
         .filter(d => d.GROEP_ID == doc.GROEP_ID)
         .sort((a, b) => (a.VOLGORDE ?? 0) - (b.VOLGORDE ?? 0));

      const idx = groep.findIndex(d => d.ID == doc.ID);
      const buur = idx + richting;
      if (buur < 0 || buur >= groep.length)
      {
         return;     // staat al bovenaan of onderaan
      }

      // Omwisselen van de twee records in de groep, zodat de volgorde klopt.
      // Daarna alle records in de groep langsgaan en VOLGORDE aanpassen als dat niet klopt
      const t = groep[idx];
      groep[idx] = groep[buur];
      groep[buur] = t;

      const gewijzigd: HeliosDocumentenDataset[] = [];
      groep.forEach((d, i) =>
      {
         if (d.VOLGORDE !== i + 1)
         {
            d.VOLGORDE = i + 1;
            gewijzigd.push(d);
         }
      });

      this.opslaanVolgorde(gewijzigd);
   }

   // Sla gewijzigde VOLGORDE op en haal na afloop één keer de documenten opnieuw op
   private opslaanVolgorde(gewijzigd: HeliosDocumentenDataset[])
   {
      if (gewijzigd.length === 0)
      {
         return;
      }

      Promise.all(gewijzigd.map(d => this.documentenService.updateDocument(d)))
         .catch(e => this.error = e)
         .finally(() => this.opvragen());
   }
}
