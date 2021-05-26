import {Component, ViewChild} from '@angular/core';
import {ModalComponent} from '../../modal/modal.component';
import {HeliosVliegtuig} from '../../../../types/Helios';

@Component({
  selector: 'app-vliegtuig-editor',
  templateUrl: './vliegtuig-editor.component.html',
  styleUrls: ['./vliegtuig-editor.component.scss']
})
export class VliegtuigEditorComponent {
  @ViewChild(ModalComponent) private popup: ModalComponent;
  vliegtuig: HeliosVliegtuig = {
    ID: undefined,
    REGISTRATIE: undefined,
    CALLSIGN: undefined,
    FLARMCODE: undefined,
    ZITPLAATSEN: undefined,
    ZELFSTART: undefined,
    CLUBKIST: undefined,
    TMG: undefined,
    SLEEPKIST: undefined,
    TYPE_ID: undefined,
    VOLGORDE: undefined,
  };

  openPopup(data: []) {
    this.haalVliegtuigOp(data);
    this.popup.open();
  }

  haalVliegtuigOp(data: []): void {
    console.log(data);
    // todo haal data op als niet undefined
  }

  submit() {
    console.log('submit');
  }

  log() {
    console.log(this.vliegtuig);
  }
}
