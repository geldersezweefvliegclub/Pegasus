import {Component, ViewChild} from '@angular/core';
import {ModalComponent} from '../../modal/modal.component';

@Component({
  selector: 'app-vliegtuig-editor',
  templateUrl: './vliegtuig-editor.component.html',
  styleUrls: ['./vliegtuig-editor.component.scss']
})
export class VliegtuigEditorComponent {
  @ViewChild(ModalComponent) private popup: ModalComponent;

  openPopup(data: []) {
    this.haalVliegtuigOp(data);
    this.popup.open();
  }

  haalVliegtuigOp(data: []): void {
    // todo haal data op als niet undefined
  }
}
