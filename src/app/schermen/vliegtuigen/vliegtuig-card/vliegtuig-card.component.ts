import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {HeliosJournaalDataset, HeliosVliegtuigenDataset} from "../../../types/Helios";
import {JournaalEditorComponent} from "../../../shared/components/editors/journaal-editor/journaal-editor.component";
import {faBug, faFileAlt, faPenToSquare} from "@fortawesome/free-solid-svg-icons";
import {SharedService} from "../../../services/shared/shared.service";
import {HeliosVliegtuigenDatasetExtended} from "../vliegtuigen-scherm/vliegtuigen-scherm.component";

@Component({
  selector: 'app-vliegtuig-card',
  templateUrl: './vliegtuig-card.component.html',
  styleUrls: ['./vliegtuig-card.component.scss']
})
export class VliegtuigCardComponent implements OnInit {
  @Input() vliegtuig: HeliosVliegtuigenDatasetExtended;
  @Output() Journaal: EventEmitter<number> = new EventEmitter<number>();
  @Output() Logboek: EventEmitter<number> = new EventEmitter<number>();
  @Output() Editor: EventEmitter<HeliosVliegtuigenDatasetExtended> = new EventEmitter<HeliosVliegtuigenDatasetExtended>();

  protected readonly iconEdit = faPenToSquare;

  constructor(private readonly sharedService: SharedService) {
  }

  ngOnInit(): void {
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

