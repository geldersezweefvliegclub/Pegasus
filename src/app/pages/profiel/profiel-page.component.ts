import {Component} from '@angular/core';
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {NgbDateFRParserFormatter} from '../../shared/ngb-date-fr-parser-formatter';
import {CustomError} from '../../types/Utils';
import {StorageService} from '../../services/storage/storage.service';
import {HeliosLid} from '../../types/Helios';
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

  opslaan(lid: HeliosLid): void {
    if (lid.ID && lid.ID > 0) {
      this.updateLid(lid)
    } else{
      this.nieuwLid(lid)
    }
  }

  updateLid(lid: HeliosLid): void {
    this.ledenService.updateLid(lid).then(() => {
      this.error = undefined;
    }).catch(e => {
      this.error = e;
    });
  }

  nieuwLid(lid:HeliosLid):void{
    this.ledenService.nieuwLid(lid).then(() => {
      this.error = undefined;
    }).catch(e => {
      this.error = e;
    });
  }
}
