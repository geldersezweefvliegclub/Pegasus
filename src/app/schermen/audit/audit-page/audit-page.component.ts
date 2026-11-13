import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {ColDef, RowSelectedEvent} from 'ag-grid-community';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {HeliosAuditDataset} from '../../../types/Helios';
import {ErrorMessage, SuccessMessage} from '../../../types/Utils';
import * as xlsx from 'xlsx';
import {nummerSort} from '../../../utils/Utils';
import {AuditService} from '../../../services/apiservice/audit.service';
import {SharedService} from '../../../services/shared/shared.service';
import {faWaveSquare} from '@fortawesome/free-solid-svg-icons';
import {DecimalPipe, KeyValuePipe} from '@angular/common';
import {DatatableComponent} from '../../../shared/components/datatable/datatable.component';
import {ErrorComponent} from '../../../shared/components/error/error.component';
import {PegasusCardComponent} from '../../../shared/components/pegasus-card/pegasus-card.component';
import {SuccessComponent} from '../../../shared/components/success/success.component';
import {ZoekbarComponent} from '../../../shared/components/zoekbar/zoekbar.component';
import {DatumRenderComponent} from '../../../shared/components/datatable/datum-render/datum-render.component';
import {TijdRenderComponent} from '../../../shared/components/datatable/tijd-render/tijd-render.component';

// eerste blok is klein zodat het grid direct gevuld is, de rest volgt in grote blokken op de achtergrond
const EERSTE_BLOK = 100;
const VOLGEND_BLOK = 10000;

// de velden van een audit record (VOOR, DATA, RESULTAAT), als JSON opgeslagen. Leeg als er niets is
type AuditVelden = Record<string, unknown> | null;

@Component({
   selector: 'app-audit-page',
   host: {class: 'scherm-pagina'},
   templateUrl: './audit-page.component.html',
   styleUrls: ['./audit-page.component.scss'],
   imports: [DatatableComponent, DecimalPipe, ErrorComponent, KeyValuePipe, PegasusCardComponent, SuccessComponent, ZoekbarComponent]
})

export class AuditPageComponent implements OnInit, OnDestroy
{
   // variablen in html formulier
   protected readonly iconCardIcon: IconDefinition = faWaveSquare;

   protected data: HeliosAuditDataset[] = [];
   protected frameworkComponents = {
      datumRender: DatumRenderComponent,
      tijdRender: TijdRenderComponent,
   };
   protected dataColumns: ColDef[] = [
      {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
      {
         colId: 'DATUM',
         field: 'LAATSTE_AANPASSING',
         headerName: 'Datum',
         cellRenderer: 'datumRender',
         sortable: true,
         maxWidth: 110
      },
      {
         colId: 'TIJD',
         field: 'LAATSTE_AANPASSING',
         headerName: 'Tijd',
         cellRenderer: 'tijdRender',
         sortable: true,
         maxWidth: 80
      },
      {field: 'NAAM', headerName: 'Naam', sortable: true},
      {field: 'ACTIE', headerName: 'Actie', sortable: true},
      {field: 'TABEL_NAAM', headerName: 'Tabel', sortable: true},
   ];

   // tonen van starts velden in rechter kolom
   protected voor: AuditVelden = null;
   protected wijziging: AuditVelden = null;
   protected resultaat: AuditVelden = null;
   protected isLoading = false;
   protected totaal = 0;               // aantal records dat aan de zoekopdracht voldoet
   protected magExporten = false;
   protected zoekString: string;
   protected success: SuccessMessage | undefined;
   protected error: ErrorMessage | undefined;

   // private variable voor ts script
   private readonly auditService = inject(AuditService);
   private readonly sharedService = inject(SharedService);
   private zoekTimer: number;                  // kleine vertraging om audit records ophalen te beperken
   // Volgnummer van de laadactie die nu bezig is. Het laden gebeurt in meerdere api calls na elkaar (await). Start de
   // gebruiker intussen een nieuwe zoekopdracht, dan loopt de oude laadactie nog gewoon door. Iedere laadactie onthoudt
   // daarom zijn eigen nummer, en na elke api call kijkt hij of dat nog het actuele nummer is. Zo niet, dan is er een
   // nieuwere laadactie gestart (of de pagina is verlaten) en stopt hij, zonder zijn records in this.data te zetten.
   // Dit voorkomt dat de gebruiker een zoekopdracht start, en dat daarna de oude zoekopdracht alsnog zijn records in het grid zet.
   // of dat records nog geladen worden terwijl de gebruiker de pagina al verlaten heeft.
   // In dat geval wordt dit.ladenBezig verhoogd in ngOnDestroy, zodat de oude laadactie stopt.
   private ladenBezig = 0;

   ngOnInit(): void
   {
      this.opvragen();
      this.magExporten = true
   }

   ngOnDestroy(): void
   {
      clearTimeout(this.zoekTimer);
      this.ladenBezig++;          // lopende laadactie stoppen, zie ladenBezig
   }

   // Opvragen van de audit records via de api, met een kleine vertraging tijdens het typen in de zoekbalk
   protected opvragen()
   {
      clearTimeout(this.zoekTimer);
      this.zoekTimer = window.setTimeout(() => this.ladenAuditRecords(), 400);
   }

   // Export naar excel
   protected exportDataset()
   {
      // LAATSTE_AANPASSING (ISO 8601) wordt een DATUM en TIJD kolom op dezelfde plek, net als in de grid
      const dataset = this.data.map((record) =>
         Object.fromEntries(Object.entries(record).flatMap(([veld, waarde]) =>
            (veld === 'LAATSTE_AANPASSING' && typeof waarde === 'string')
               ? [['DATUM', this.sharedService.datumDMJ(waarde)], ['TIJD', this.sharedService.tijdHM(waarde)]]
               : [[veld, waarde]])));
      const ws = xlsx.utils.json_to_sheet(dataset);
      const wb: xlsx.WorkBook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
      xlsx.writeFile(wb, 'audit ' + new Date().toJSON().slice(0, 10) + '.xlsx');
   }

   protected selectRow($event: RowSelectedEvent)
   {
      this.voor = JSON.parse($event.data.VOOR);
      this.wijziging = JSON.parse($event.data.DATA);
      this.resultaat = JSON.parse($event.data.RESULTAAT);

   }

   // Eerst een klein blok zodat het grid snel gevuld is, daarna de rest op de achtergrond. Filteren in ag-grid gebeurt
   // op de client, daarvoor moeten uiteindelijk alle records geladen zijn
   private async ladenAuditRecords()
   {
      const mijnLaadactie = ++this.ladenBezig;     // nieuw nummer, een eventuele oudere laadactie stopt hierdoor
      this.isLoading = true;

      try
      {
         const eerste = await this.auditService.getAudit(this.zoekString, EERSTE_BLOK);
         if (mijnLaadactie !== this.ladenBezig) return;   // inmiddels vervangen door een nieuwere laadactie

         this.data = eerste.dataset ?? [];
         this.totaal = eerste.totaal ?? this.data.length;
         this.isLoading = false;

         let blokGrootte = this.data.length;
         while (blokGrootte > 0 && this.data.length < this.totaal)
         {
            const laagsteID = this.data[this.data.length - 1].ID;
            const blok = await this.auditService.getAudit(this.zoekString, VOLGEND_BLOK, laagsteID);
            if (mijnLaadactie !== this.ladenBezig) return;   // inmiddels vervangen door een nieuwere laadactie

            const records = blok.dataset ?? [];
            blokGrootte = records.length;
            this.data = this.data.concat(records);
         }
      }
      catch (e)
      {
         if (mijnLaadactie !== this.ladenBezig) return;   // inmiddels vervangen door een nieuwere laadactie
         this.isLoading = false;
         this.error = e;
      }
   }
}
