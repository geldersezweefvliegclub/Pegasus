import { Component, Input, inject, output } from '@angular/core';
import { HeliosVliegtuigenDataset } from '../../../types/Helios';
import { faBug, faFileAlt, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { SharedService } from '../../../services/shared/shared.service';
import { HeliosVliegtuigenDatasetExtended } from '../vliegtuigen-scherm/vliegtuigen-scherm.component';

import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { VliegtuigEditorComponent } from '../../../shared/components/editors/vliegtuig-editor/vliegtuig-editor.component';

@Component({
    selector: 'app-vliegtuig-card',
    templateUrl: './vliegtuig-card.component.html',
    styleUrls: ['./vliegtuig-card.component.scss'],
    imports: [FaIconComponent, VliegtuigEditorComponent]
})
export class VliegtuigCardComponent  {
  @Input() vliegtuig: HeliosVliegtuigenDatasetExtended;
  readonly Journaal = output<number>();
  readonly Logboek = output<number>();
  readonly Editor = output<HeliosVliegtuigenDatasetExtended>();

  // variablen in html formulier
  protected readonly iconEdit = faPenToSquare;
  protected readonly journaalIcon = faBug;
  protected readonly logboekIcon = faFileAlt;

  // private variable voor ts script
  private readonly sharedService = inject(SharedService);

  protected editorButtonClicked() {
    this.Editor.emit(this.vliegtuig as HeliosVliegtuigenDataset);
  }

  protected logboekButtonClicked() {
    const id = this.vliegtuig.ID;
    if (id === undefined) {
      console.error("Kan logboek niet openen zonder vliegtuig-ID.");
      return;
    }
    this.Logboek.emit(id);
  }

  protected journaalButtonClicked() {
    const id = this.vliegtuig.ID;
    if (id === undefined) {
      console.error("Kan journaal niet openen zonder vliegtuig-ID.");
      return;
    }
    this.Journaal.emit(id);
  }
}
