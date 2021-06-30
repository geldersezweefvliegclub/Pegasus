import {Component} from '@angular/core';
import {faInfo} from '@fortawesome/free-solid-svg-icons';
import {HeliosLid, HeliosUserinfo} from '../../types/Helios';
import {LedenService} from '../../services/apiservice/leden.service';
import {StorageService} from '../../services/storage/storage.service';
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {NgbDateFRParserFormatter} from '../../shared/ngb-date-fr-parser-formatter';

@Component({
  selector: 'app-profile1',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class ProfilePageComponent {
  informatieIcon = faInfo;
  persoon: HeliosUserinfo = {}

  constructor(private readonly lidService: LedenService, private readonly storageService: StorageService) {
    this.persoon = this.storageService.ophalen('userInfo')
    console.log(this.persoon)
  }

  submit() {

  }
}
