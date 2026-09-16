import { Component, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, input, viewChild } from '@angular/core';
import { FlarmData, FlarmInputService } from '../../../services/flarm-input.service';
import { Subscription } from 'rxjs';
import { DateTime } from 'luxon';
import { StartlijstService } from '../../../services/apiservice/startlijst.service';
import { StartDetailsComponent } from '../start-details/start-details.component';


interface FlarmDataExt extends FlarmData {
    flarmOntvangstStatusClass?: string;
}
@Component({
    selector: 'app-flarm-lijst',
    templateUrl: './flarm-lijst.component.html',
    styleUrls: ['./flarm-lijst.component.scss'],
    imports: [StartDetailsComponent]
})
export class FlarmLijstComponent implements OnInit, OnDestroy, OnChanges {
  private readonly flarmService = inject(FlarmInputService);
  private readonly startService = inject(StartlijstService);

  readonly veldID = input<number>();
  readonly startDetails = viewChild.required(StartDetailsComponent);

  private flarmAbonnement: Subscription;

  flarmData: FlarmDataExt[] = [];
  grond: FlarmDataExt[] = [];
  takeoff: FlarmDataExt[] = [];
  flying: FlarmDataExt[] = [];
  landing: FlarmDataExt[] = [];

  private classTimer: number;

  ngOnInit(): void {
    this.classTimer = window.setInterval(() => {
      for (const item of this.flying) {
        item.flarmOntvangstStatusClass = this.flarmOntvangstStatus(item);
      }

      for (const item of this.landing) {
        item.flarmOntvangstStatusClass = this.flarmOntvangstStatus(item);
      }

      for (const item of this.takeoff) {
        item.flarmOntvangstStatusClass = this.flarmOntvangstStatus(item);
      }

      for (const item of this.grond) {
        item.flarmOntvangstStatusClass = this.flarmOntvangstStatus(item);
      }

    }, 1000 * 5);

    this.flarmAbonnement = this.flarmService.flarmUpdate.subscribe((flarmData) => {
      this.splitOnStatus(flarmData);
    })
  }

  ngOnDestroy(): void {
    if (this.flarmAbonnement)     this.flarmAbonnement.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.veldID)
      this.splitOnStatus(this.flarmData);
  }

  splitOnStatus(flarmData: FlarmData[]): void {
    this.flarmData = flarmData.sort(function (a, b): number {
      if (b.altitude_agl! !== a.altitude_agl!) return b.altitude_agl! - a.altitude_agl!
      if (a.START_ID == undefined) return 1;
      if (b.START_ID == undefined) return -1;

      return a.START_ID - b.START_ID;
    });

    for (const item of this.flarmData) {
      item.flarmOntvangstStatusClass = this.flarmOntvangstStatus(item);
      item.starttijd = item.starttijd ? item.starttijd : "--:--";
      item.landingstijd = item.landingstijd ? item.landingstijd : "--:--";
    }

    this.grond = this.flarmData.filter((flarm) => {
      const veldID = this.veldID();
      return flarm.status === 'On_Ground' && (veldID === null || flarm.VELD_ID === veldID);
    });
    this.takeoff = this.flarmData.filter((flarm) => {
      const veldID = this.veldID();
      return flarm.status === 'TakeOff' && (veldID === null || flarm.VELD_ID === veldID);
    });
    this.flying = this.flarmData.filter((flarm) => {
      const veldID = this.veldID();
      return flarm.status === 'Flying' && (veldID === null || flarm.VELD_ID === veldID);
    });
    this.landing = this.flarmData.filter((flarm) => {
      const veldID = this.veldID();
      return (flarm.status === 'Landing' || flarm.status === 'Circuit') && (veldID === null || flarm.VELD_ID === veldID);
    });

    if ((this.grond.length % 2 === 1) && (this.grond.length > 1))
    {
      const z: FlarmData = {
        status: 'On_Ground',
        flarmID: undefined
      };
      this.grond.splice(1, 0, z);
    }
  }

  flarmOntvangstStatus(flarm: FlarmData): string {
    const now= Math.round(DateTime.now().hour*60 + DateTime.now().minute + DateTime.now().second/60);

    if (flarm.ts === undefined) return "";

    const timeDiff = now - flarm.ts;
    const step = Math.min(timeDiff, 10);
    return "color-" + step;
  }

  toonStartdetails(flarm: FlarmData) {
    if (flarm.START_ID === undefined) return;
    this.startDetails().openPopup(flarm);
  }
}