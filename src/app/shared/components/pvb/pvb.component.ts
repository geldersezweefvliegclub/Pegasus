import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {HeliosProgressieDataset} from "../../../types/Helios";

@Component({
  selector: 'app-pvb',
  templateUrl: './pvb.component.html',
  styleUrls: ['./pvb.component.scss']
})
export class PvbComponent implements OnInit, OnChanges {
  @Input() VliegerID: number;
  PVBs: any[];
  gehaaldeProgressie: HeliosProgressieDataset[];

  constructor(private readonly configService: PegasusConfigService,
              private readonly progressieService: ProgressieService) { }

  ngOnInit(): void {
    this.PVBs = this.configService.getPVB();
    this.ophalen();
   }

  ophalen(): void {
    if (!this.PVBs) // er zijn nog geen PVB
      return;

    // maak CSV string met de competentie IDs van de PVBs
    const comptentieIDs = this.PVBs.map((p:any) => {
      return p.Lokaal + "," + p.Overland;
    }).join(',');

    this.progressieService.getProgressie(this.VliegerID, comptentieIDs).then((p) => this.gehaaldeProgressie = p);
  }

  PVBgehaald(comptentieID: number): boolean {

    if (!this.gehaaldeProgressie) return false;

    if (this.gehaaldeProgressie.findIndex((p) => p.COMPETENTIE_ID == comptentieID) >= 0) {
      return true;
    }
    return false;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("VliegerID")) {
      this.ophalen()
    }
  }
}

