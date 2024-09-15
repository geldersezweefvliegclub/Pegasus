import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HeliosAgendaDataset } from '../../../types/Helios';
import { AgendaService } from '../../../services/apiservice/agenda';
import { Subscription } from 'rxjs';
import { DateTime } from 'luxon';
import { ColDef, RowDoubleClickedEvent } from 'ag-grid-community';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import { LoginService } from '../../../services/apiservice/login.service';
import { SharedService } from '../../../services/shared/shared.service';
import { nummerSort } from '../../../utils/Utils';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { AgendaEditorComponent } from '../../../shared/components/editors/agenda-editor/agenda-editor.component';
import { DatumRenderComponent } from '../../../shared/components/datatable/datum-render/datum-render.component';

@Component({
  selector: 'app-agenda-scherm',
  templateUrl: './agenda-scherm.component.html',
  styleUrls: ['./agenda-scherm.component.scss']
})
export class AgendaSchermComponent implements OnInit, OnDestroy {
  @ViewChild(AgendaEditorComponent) editor:AgendaEditorComponent;

  data:HeliosAgendaDataset[] = [];
  isLoading = false;

  private dbEventAbonnement: Subscription;    // Abonneer op aanpassingen in de database
  private datumAbonnement: Subscription;      // volg de keuze van de kalender
  private maandAbonnement: Subscription;      // volg de keuze van de kalender
  datum: DateTime = DateTime.now();           // de gekozen dag

  deleteMode = false;        // zitten we in delete mode om vliegtuigen te kunnen verwijderen
  trashMode = false;         // zitten in restore mode om vliegtuigen te kunnen terughalen

  magToevoegen = false;
  magVerwijderen = false;
  magWijzigen = false;

  success: SuccessMessage | undefined;
  error: ErrorMessage | undefined;

  dataColumns: ColDef[] = [
    {field: 'ID', headerName: 'ID', sortable: true, hide: true, comparator: nummerSort},
    {field: 'DATUM', headerName: 'Datum', cellRenderer: 'datumRender', sortable: true, maxWidth: 100},
    {field: 'TIJD', headerName: 'Tijd', maxWidth: 60},
    {field: 'KORT', headerName: 'Aktiviteit', sortable: true, width:200 , suppressSizeToFit: true, suppressAutoSize: true},
    {field: 'OMSCHRIJVING', headerName: 'Beschrijving', sortable: true},
  ];

  // kolom om record te verwijderen
  deleteColumn: ColDef[] = [{
    pinned: 'left',
    maxWidth: 100,
    initialWidth: 100,
    resizable: false,
    suppressSizeToFit:true,
    hide: false,
    cellRenderer: 'deleteAction', headerName: '', sortable: false,
    cellRendererParams: {
      onDeleteClicked: (ID: number) => {
        this.editor.openVerwijderPopup(ID);
      }
    },
  }];

  // kolom om terug te kunnen terughalen
  restoreColumn: ColDef[] = [{
    pinned: 'left',
    maxWidth: 100,
    initialWidth: 100,
    resizable: false,
    suppressSizeToFit:true,
    hide: false,
    cellRenderer: 'restoreAction', headerName: '', sortable: false,
    cellRendererParams: {
      onRestoreClicked: (ID: number) => {
        this.editor.openRestorePopup(ID);
      }
    },
  }];

  columns: ColDef[];

  frameworkComponents = {
    datumRender: DatumRenderComponent
  };

  iconCardIcon: IconDefinition = faCalendar

  constructor(private readonly loginService: LoginService,
              private readonly sharedService: SharedService,
              private readonly agendaService: AgendaService) { }

  ngOnInit(): void {
    console.log("AgendaSchermComponent.ngOnInit");
    // Op safari hebben we een korte vertraging nodig op te zorgen dat initialisatie gedaan is
    setTimeout(() => {
      // de datum zoals die in de kalender gekozen is
      this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
        // ophalen is alleen nodig als er een ander jaar gekozen is in de kalendar
        const ophalen = ((this.data === undefined) || (this.datum.year !== datum.year))
        this.datum = DateTime.fromObject({
          year: datum.year,
          month: datum.month,
          day: datum.day
        })
        if (ophalen) {
          this.data = [];
          this.opvragen();
        }
      });

      // de datum zoals die in de kalender gekozen is
      this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
        if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
          // ophalen is alleen nodig als er een ander jaar gekozen is in de kalendar
          const ophalen = ((this.data === undefined) || (this.datum.year !== jaarMaand.year))
          this.datum = DateTime.fromObject({
            year: jaarMaand.year,
            month: jaarMaand.month,
            day: 1
          })
          if (ophalen) {
            this.data = [];
            this.opvragen();
          }
        }
      })

      this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
        if (ev.tabel === "Agenda") {
          this.opvragen();
        }
      });
    }, 250);

    const ui = this.loginService.userInfo?.LidData;
    if (ui?.BEHEERDER)
    {
        this.magWijzigen = true;
        this.magToevoegen = true;
        this.magVerwijderen = true;
    }

    // plaats de juiste kolommen in het grid
    this.kolomDefinitie();
    this.opvragen();
  }

  ngOnDestroy(): void {
    if (this.dbEventAbonnement)     this.dbEventAbonnement.unsubscribe();
    if (this.maandAbonnement)       this.maandAbonnement.unsubscribe();
    if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
  }

  opvragen() {
    this.isLoading = true;

    const startDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
    const eindDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});


    this.agendaService.getAgenda(startDatum, eindDatum, 5000, this.trashMode).then((dataset) => {
      this.isLoading = false;
      this.data = dataset;

      const ui = this.loginService.userInfo?.Userinfo;

    }).catch(e => {
      this.isLoading = false;
      this.error = e;
    });
  }

  kolomDefinitie() {
    if (!this.deleteMode) {
      this.columns = this.dataColumns;
    } else {
      if (this.trashMode) {
        this.columns = this.restoreColumn.concat(this.dataColumns);
      } else {
        this.columns = this.deleteColumn.concat(this.dataColumns);
      }
    }
  }

  addAgenda() {
    if (this.magToevoegen) {
      this.editor.openPopup(null);
    }
  }

  openEditor(event?: RowDoubleClickedEvent) {
    if (this.magWijzigen) {
      this.editor.openPopup(event?.data as HeliosAgendaDataset);
    }
  }

  // schakelen tussen deleteMode JA/NEE. In deleteMode kun je vliegtuigen verwijderen
  deleteModeJaNee() {
    this.deleteMode = !this.deleteMode;

    if (this.trashMode) {
      this.trashModeJaNee(false);
    }
    this.kolomDefinitie();
  }

  trashModeJaNee(actief: boolean) {
    this.trashMode = actief
    this.kolomDefinitie();
    this.opvragen();
  }
}
