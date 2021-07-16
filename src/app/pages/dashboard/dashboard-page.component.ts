import {Component} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {
  faBookmark, faCalendarAlt, faChartLine, faChartPie,
  faClipboardList,
  faTachometerAlt,
} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../services/apiservice/login.service";
import {HeliosLid, HeliosType, HeliosTypes} from "../../types/Helios";
import {ActivatedRoute} from "@angular/router";
import {LedenService} from "../../services/apiservice/leden.service";
import {TypesService} from "../../services/apiservice/types.service";
import {faAvianex} from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent {
  iconCardIcon: IconDefinition = faChartPie;
  iconProgressie: IconDefinition = faChartLine;
  iconLogboek: IconDefinition = faClipboardList;
  iconRooster: IconDefinition = faCalendarAlt;
  iconRecency: IconDefinition = faTachometerAlt;
  iconPVB: IconDefinition = faAvianex;
  iconStatus: IconDefinition = faBookmark;

  lidTypes: HeliosType[] = [];
  lidData: HeliosLid;

  constructor(private readonly ledenService: LedenService,
              private readonly loginService: LoginService,
              private readonly typesService: TypesService,
              private activatedRoute: ActivatedRoute) {

    this.typesService.getTypes(6).then(types => this.lidTypes = types);

    this.activatedRoute.queryParams.subscribe(params => {

      if (params['lidID']) {
        const lidID = params['lidID'];
        this.ledenService.getLid(lidID).then((l) => this.lidData = l);
      }
      else  {
        this.lidData = this.loginService.userInfo?.LidData as HeliosLid;
      }
    });
  }

  getLidType(): string {
    const t = this.lidTypes.find(type => type.ID == this.lidData.LIDTYPE_ID) as HeliosType;
    if (t) {
      return t.OMSCHRIJVING!;
    }
    return "";
  }
}
