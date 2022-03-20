import { Component, OnInit } from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faDownload, faPen} from "@fortawesome/free-solid-svg-icons";
import {Subscription} from "rxjs";
import {HeliosDienstenDataset, HeliosRoosterDataset, HeliosStartDataset} from "../../types/Helios";
import {DateTime, Interval} from "luxon";
import {StartlijstService} from "../../services/apiservice/startlijst.service";
import {LoginService} from "../../services/apiservice/login.service";
import {RoosterService} from "../../services/apiservice/rooster.service";
import {DienstenService} from "../../services/apiservice/diensten.service";
import {PegasusConfigService} from "../../services/shared/pegasus-config.service";
import {SharedService} from "../../services/shared/shared.service";


@Component({
  selector: 'app-startlijst-page',
  templateUrl: './startlijst-page.component.html',
  styleUrls: ['./startlijst-page.component.scss']
})
export class StartlijstPageComponent implements OnInit {

  startlijstIcon: IconDefinition = faPen;

  data: HeliosStartDataset[] = [];

  isStarttoren: boolean = false;

  private datumAbonnement: Subscription; // volg de keuze van de kalender
  datum: DateTime;                       // de gekozen dag in de kalender

  constructor(private readonly startlijstService: StartlijstService,
              private readonly loginService: LoginService,
              private readonly sharedService: SharedService) { }

  ngOnInit(): void {
    // de datum zoals die in de kalender gekozen is
    this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
      this.datum = DateTime.fromObject({
        year: datum.year,
        month: datum.month,
        day: datum.day
      })
      this.data = [];

      const ui = this.loginService.userInfo?.Userinfo;
      const nu: DateTime = DateTime.now()

      this.isStarttoren = ui!.isStarttoren as boolean;

      //this.opvragen();
    });
  }

}
