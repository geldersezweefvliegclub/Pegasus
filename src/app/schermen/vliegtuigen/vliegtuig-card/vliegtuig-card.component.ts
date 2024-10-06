import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HeliosVliegtuigenDataset } from '../../../types/Helios';
import { faBug, faFileAlt, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { SharedService } from '../../../services/shared/shared.service';
import { HeliosVliegtuigenDatasetExtended } from '../vliegtuigen-scherm/vliegtuigen-scherm.component';

@Component({
  selector: 'app-vliegtuig-card',
  templateUrl: './vliegtuig-card.component.html',
  styleUrls: ['./vliegtuig-card.component.scss']
})
export class VliegtuigCardComponent  {
  @Input() vliegtuig: HeliosVliegtuigenDatasetExtended;
  @Output() Journaal: EventEmitter<number> = new EventEmitter<number>();
  @Output() Logboek: EventEmitter<number> = new EventEmitter<number>();
  @Output() Editor: EventEmitter<HeliosVliegtuigenDatasetExtended> = new EventEmitter<HeliosVliegtuigenDatasetExtended>();

  protected readonly iconEdit = faPenToSquare;

  constructor(private readonly sharedService: SharedService) {
  }

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

