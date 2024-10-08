import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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
  styleUrls: ['./flarm-lijst.component.scss']
})
export class FlarmLijstComponent implements OnInit, OnDestroy, OnChanges {
  @Input() veldID: number | undefined
  @ViewChild(StartDetailsComponent) startDetails: StartDetailsComponent;

  private flarmAbonnement: Subscription;

  flarmData: FlarmDataExt[] = [];
  grond: FlarmDataExt[] = [];
  takeoff: FlarmDataExt[] = [];
  flying: FlarmDataExt[] = [];
  landing: FlarmDataExt[] = [];

  private classTimer: number;

  constructor(private readonly flarmService: FlarmInputService,
              private readonly startService: StartlijstService) { }

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

    this.grond = this.flarmData.filter((flarm) => flarm.status === 'On_Ground' && (this.veldID === null || flarm.VELD_ID === this.veldID));
    this.takeoff = this.flarmData.filter((flarm) => flarm.status === 'TakeOff' && (this.veldID === null || flarm.VELD_ID === this.veldID));
    this.flying = this.flarmData.filter((flarm) => flarm.status === 'Flying' && (this.veldID === null || flarm.VELD_ID === this.veldID));
    this.landing = this.flarmData.filter((flarm) => (flarm.status === 'Landing' || flarm.status === 'Circuit') && (this.veldID === null || flarm.VELD_ID === this.veldID));

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
    this.startDetails.openPopup(flarm);
  }
}