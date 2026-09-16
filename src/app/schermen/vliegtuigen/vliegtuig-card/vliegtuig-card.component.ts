import { Component, Input, inject, output } from '@angular/core';
import { HeliosVliegtuigenDataset } from '../../../types/Helios';
import { faBug, faFileAlt, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { SharedService } from '../../../services/shared/shared.service';
import { HeliosVliegtuigenDatasetExtended } from '../vliegtuigen-scherm/vliegtuigen-scherm.component';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { VliegtuigEditorComponent } from '../../../shared/components/editors/vliegtuig-editor/vliegtuig-editor.component';

@Component({
    selector: 'app-vliegtuig-card',
    templateUrl: './vliegtuig-card.component.html',
    styleUrls: ['./vliegtuig-card.component.scss'],
    imports: [NgClass, FaIconComponent, VliegtuigEditorComponent]
})
export class VliegtuigCardComponent  {
  private readonly sharedService = inject(SharedService);

  @Input() vliegtuig: HeliosVliegtuigenDatasetExtended;
  readonly Journaal = output<number>();
  readonly Logboek = output<number>();
  readonly Editor = output<HeliosVliegtuigenDatasetExtended>();

  protected readonly iconEdit = faPenToSquare;

  editorButtonClicked() {
    this.Editor.emit(this.vliegtuig as HeliosVliegtuigenDataset);
  }

  logboekButtonClicked() {
    this.Logboek.emit(this.vliegtuig.ID);
  }

  journaalButtonClicked() {
    this.Journaal.emit(this.vliegtuig.ID);
  }

  protected readonly journaalIcon = faBug;
  protected readonly logboekIcon = faFileAlt;
}

