import {Component, OnInit, ViewChild} from '@angular/core';
import {ModalComponent} from "../../modal/modal.component";
import {HeliosAgendaActiviteit, HeliosAgendaDataset, HeliosJournaal} from "../../../../types/Helios";
import {AgendaService} from "../../../../services/apiservice/agenda";
import {ErrorMessage, SuccessMessage} from "../../../../types/Utils";
import {LoginService} from "../../../../services/apiservice/login.service";
import {DateTime} from "luxon";

@Component({
  selector: 'app-agenda-editor',
  templateUrl: './agenda-editor.component.html',
  styleUrls: ['./agenda-editor.component.scss']
})
export class AgendaEditorComponent  {
  @ViewChild(ModalComponent) private popup: ModalComponent;

  isLoading: boolean = false;
  isSaving: boolean = false;

  isVerwijderMode: boolean = false;
  isRestoreMode: boolean = false;
  formTitel: string = "";

  activiteit: HeliosAgendaActiviteit = {}

  success: SuccessMessage | undefined;
  error: ErrorMessage | undefined;

  eersteDag: DateTime | undefined;
  laatsteDag: DateTime | undefined;

  constructor(private readonly agendaService: AgendaService,
              private readonly loginService: LoginService) { }

  openPopup(activiteit: HeliosAgendaDataset | null) {
    if (activiteit) {
      // vul alvast de editor met starts uit het grid
      this.activiteit = {
        ID: activiteit.ID,
        DATUM: activiteit.DATUM,
        TIJD: activiteit.TIJD,
        KORT: activiteit.KORT,
        OMSCHRIJVING: activiteit.OMSCHRIJVING,
      }

      this.formTitel = 'Activiteit bewerken';
      this.haalAktiviteitOp(activiteit.ID!); // maar activiteit kan gewijzigd zijn, dus toch even starts ophalen van API
    } else {
      this.activiteit = {
        ID: undefined,
        DATUM: undefined,
        TIJD: undefined,
        KORT: undefined,
        OMSCHRIJVING: undefined,
      }

      this.formTitel = 'Activiteit aanmaken';
    }

    this.isSaving = false;
    this.isVerwijderMode = false;
    this.isRestoreMode = false;
    this.popup.open();
  }

  closePopup() {
    this.popup.close();
  }

  haalAktiviteitOp(id: number): void {
    this.isLoading = true;

    try {
      this.agendaService.getActiviteit(id).then((activiteit) => {
        this.activiteit = activiteit;

        this.eersteDag = DateTime.fromSQL(activiteit.DATUM!)
        this.isLoading = false;
      });
    } catch (e) {
      this.isLoading = false;
    }
  }

  openVerwijderPopup(id: number) {
    this.haalAktiviteitOp(id);
    this.formTitel = 'Activiteit verwijderen';

    this.isSaving = false;
    this.isVerwijderMode = true;
    this.isRestoreMode = false;
    this.popup.open();
  }

  openRestorePopup(id: number) {
    this.haalAktiviteitOp(id);
    this.formTitel = 'Activiteit herstellen';

    this.isSaving = false;
    this.isRestoreMode = true;
    this.isVerwijderMode = false;
    this.popup.open();
  }

  uitvoeren() {
    this.isSaving = true;
    if (this.isRestoreMode) {
      this.Herstellen(this.activiteit);
    }

    if (this.isVerwijderMode) {
      this.Verwijderen(this.activiteit);
    }

    if (!this.isVerwijderMode && !this.isRestoreMode) {
      if (this.activiteit.ID) {
        this.Aanpassen(this.activiteit);
      } else {
        this.Toevoegen(this.activiteit);
      }
    }
  }

  // opslaan van de starts van een nieuw vliegtuig
  Toevoegen(activiteit: HeliosJournaal) {

    if (this.eersteDag && !this.laatsteDag) {
      const datum = DateTime.fromObject({year: this.eersteDag.year, month: this.eersteDag.month, day: this.eersteDag.day});
      activiteit.DATUM = datum.toISODate() as string;
      this.Add(activiteit);
    }
    else if (this.eersteDag && this.laatsteDag) {
      const van = DateTime.fromObject({year: this.eersteDag.year, month: this.eersteDag.month, day: this.eersteDag.day});
      const tot = DateTime.fromObject({year: this.laatsteDag.year, month: this.laatsteDag.month, day: this.laatsteDag.day});

      const diff = tot.diff(van, 'days').days;

      for (let i = 0; i <= diff; i++) {
        const datum = van.plus({days: i});
        activiteit.DATUM = datum.toISODate() as string;
        this.Add(activiteit);
      }
    }
  }

  Add (activiteit: HeliosAgendaActiviteit) {
    this.agendaService.addActiviteit(activiteit).then(() => {
      this.success = {
        titel: "Agenda",
        beschrijving: "Activiteit is toegevoegd"
      }
      this.closePopup();
    }).catch(e => {
      this.isSaving = false;
      this.error = e;
    })
  }

  // bestaand vliegtuig is aangepast. Opslaan van de starts
  Aanpassen(activiteit: HeliosAgendaActiviteit) {

    if (this.eersteDag)
    {
      const datum = DateTime.fromObject({
        year: this.eersteDag.year,
        month: this.eersteDag.month,
        day: this.eersteDag.day
      });
      activiteit.DATUM = datum.toISODate() as string;

      this.agendaService.updateActiviteit(activiteit).then(() => {
        this.success = {
          titel: "Agenda",
          beschrijving: "Activiteit is aangepast"
        }
        this.closePopup();
      }).catch(e => {
        this.isSaving = false;
        this.error = e;
      })
    }
  }

  // markeer een vliegtuig als verwijderd
  Verwijderen(activiteit: HeliosAgendaActiviteit) {
    this.agendaService.deleteActiviteit(activiteit.ID!).then(() => {
      this.success = {
        titel: "Agenda",
        beschrijving: "Activiteit is verwijderd"
      }
      this.closePopup();
    }).catch(e => {
      this.isSaving = false;
      this.error = e;
    })
  }

  // de vliegtuig is weer terug, haal de markering 'verwijderd' weg
  Herstellen(activiteit: HeliosAgendaActiviteit) {
    this.agendaService.restoreActiviteit(activiteit.ID!).then(() => {
      this.success = {
        titel: "Activiteit",
        beschrijving: "Activiteit is weer beschikbaar"
      }
      this.closePopup();
    }).catch(e => {
      this.isSaving = false;
      this.error = e;
    })
  }

  opslaanDisabled(): boolean {
    return !this.vanTotOke();
  }

  // is eerste datum eerder dan eind datum?
  vanTotOke(): boolean {
    if (this.eersteDag && this.laatsteDag) {
      const begin = this.eersteDag.year * 10000 + this.eersteDag.month * 100 + this.eersteDag.day;
      const eind = this.laatsteDag.year * 10000 + this.laatsteDag.month * 100 + this.laatsteDag.day;

      return (begin <= eind) ? true : false;
    }

    if (this.eersteDag && !this.laatsteDag) {
      return true;
    }
    return false;
  }
}
