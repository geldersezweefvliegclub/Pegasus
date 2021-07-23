import {Component} from '@angular/core';
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {NgbDateFRParserFormatter} from '../../shared/ngb-date-fr-parser-formatter';
import {CustomError} from '../../types/Utils';
import {StorageService} from '../../services/storage/storage.service';
import {HeliosLid, HeliosUserinfo} from '../../types/Helios';
import {LedenService} from '../../services/apiservice/leden.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profiel-page.component.html',
  styleUrls: ['./profiel-page.component.scss'],
  providers: [{provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}]
})
export class ProfielPageComponent {
  lidID: number;
  error: CustomError | undefined;
  isLoading = false;

  constructor(
    private readonly ledenService: LedenService,
    private activatedRoute: ActivatedRoute,
    private storageService: StorageService) {

    // Als lidID is meegegeven in URL, moeten we de lidData ophalen
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['lidID']) {
        this.lidID = params['lidID'];
      } else {
        this.lidID = this.storageService.ophalen('userInfo').LidData.ID;
      }
    });
  }

  opslaan(lid: HeliosUserinfo): void {
    this.isLoading = true;

    this.ledenService.updateLid(lid).then(() => {
      this.isLoading = false;
      this.error = undefined;
    }).catch(e => {
      this.isLoading = false;
      this.error = e;
    });
  }
}
