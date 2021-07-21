import {Component} from '@angular/core';
import {faEye, faEyeSlash, faInfo, faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {HeliosType, HeliosUserinfo} from '../../types/Helios';
import {LedenService} from '../../services/apiservice/leden.service';
import {StorageService} from '../../services/storage/storage.service';
import {NgbDate, NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {NgbDateFRParserFormatter} from '../../shared/ngb-date-fr-parser-formatter';
import {DateTime} from 'luxon';
import {TypesService} from '../../services/apiservice/types.service';
import {CustomError} from '../../types/Utils';

@Component({
  selector: 'app-profile',
  templateUrl: './profiel-page.component.html',
  styleUrls: ['./profiel-page.component.scss'],
  providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class ProfielPageComponent {
  informatieIcon = faInfo;
  user: HeliosUserinfo = {};
  types: HeliosType[];
  error: CustomError | undefined;
  wachtwoordVerborgen: boolean = true;
  oogIcon = faEye;
  controleWachtwoord = '';
  wachtwoord = '';
  isLoading = false;
  infoIcon = faInfoCircle;

  constructor(
    private readonly ledenService: LedenService,
    private readonly typeService: TypesService,
    private readonly storageService: StorageService) {
    this.user = this.storageService.ophalen('userInfo');
    this.haalLidmaatschappenOp();
  }

  haalLidmaatschappenOp(): void {
    this.typeService.getTypes(6).then(types => this.types = types).catch(e => this.error = e);
  }

  submit() {
    this.isLoading = true;

    this.ledenService.updateLid(this.user).then(() => {
      this.isLoading = false;
      this.error = undefined;
    }).catch(e => {
      this.isLoading = false;
      this.error = e;
    });
  }

  converteerDatumNaarISO($event: NgbDate): string {
    const unformatted = DateTime.fromObject($event);
    return unformatted.isValid ? unformatted.toISODate().toString() : '';
  }

  verbergWachtwoord() {
    this.wachtwoordVerborgen = !this.wachtwoordVerborgen;
    this.oogIcon = this.wachtwoordVerborgen ? faEye : faEyeSlash;
  }
}
