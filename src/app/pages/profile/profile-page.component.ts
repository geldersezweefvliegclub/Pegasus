import {Component} from '@angular/core';
import {faEye, faEyeSlash, faInfo} from '@fortawesome/free-solid-svg-icons';
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
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class ProfilePageComponent {
  informatieIcon = faInfo;
  persoon: HeliosUserinfo = {};
  types: HeliosType[];
  error: CustomError;
  wachtwoordVerborgen: boolean = true;
  oogIcon = faEye;
  controleWachtwoord = '';

  constructor(
    private readonly lidService: LedenService,
    private readonly typeService: TypesService,
    private readonly storageService: StorageService) {
    this.persoon = this.storageService.ophalen('userInfo');
    console.log(this.persoon);
    this.haalLidmaatschappenOp();
  }

  haalLidmaatschappenOp(): void {
    this.typeService.getTypes(6).then(types => this.types = types).catch(e => this.error = e);
  }

  submit() {
    // Gebruik lidservice
  }

  converteerDatumNaarISO($event: NgbDate): string {
    const unformatted = DateTime.fromObject($event);
    const test = unformatted.isValid ? unformatted.toISODate().toString() : '';
    console.log('returning: ', test);
    return test;
  }

  verbergWachtwoord() {
    this.wachtwoordVerborgen = !this.wachtwoordVerborgen;
    this.oogIcon = this.wachtwoordVerborgen ? faEye : faEyeSlash;
  }
}
