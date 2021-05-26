import {Component, ViewChild} from '@angular/core';
import {ModalComponent} from '../../modal/modal.component';
import {HeliosType, HeliosVliegtuig} from '../../../../types/Helios';
import {VliegtuigenService} from '../../../../services/vliegtuigen/vliegtuigen.service';
import {TypesService} from '../../../../services/types/types.service';

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
  vliegtuigTypes: HeliosType[];

  constructor(
    private readonly vliegtuigenService: VliegtuigenService,
    private readonly typesService: TypesService
  ) {
    this.typesService.getTypes(4).then(types => this.vliegtuigTypes = types);
  }

  openPopup(data: []) {
    this.haalVliegtuigOp(data);
    this.popup.open();
  }

  haalVliegtuigOp(data: HeliosVliegtuig | undefined): void {
    if (data) {
      this.vliegtuigenService.getVliegtuig(data.ID as number).then((vliegtuig) => {
        this.vliegtuig = vliegtuig;
      });
    }
  }

  submit() {
    console.log('submit');
  }

  log() {
    console.log(this.vliegtuig);
  }
}
