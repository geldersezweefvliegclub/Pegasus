import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {HeliosStartDataset} from "../../../types/Helios";
import {FlarmData} from "../../../services/flarm-input.service";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {DateTime} from "luxon";

@Component({
  selector: 'app-start-details',
  templateUrl: './start-details.component.html',
  styleUrls: ['./start-details.component.scss']
})
export class StartDetailsComponent  {
  @ViewChild(ModalComponent) private popup: ModalComponent;
  start: HeliosStartDataset | undefined;
  flarm: FlarmData;
  ts: string;
  constructor(private readonly startService: StartlijstService) { }

  openPopup(flarm: FlarmData) {
    const now = DateTime.now().hour * 60 + Math.round(DateTime.now().minute + DateTime.now().second / 60);
    const diff = now - flarm.ts!;

    const hh:number= Math.floor(flarm.ts!/60)
    const mm: string = (flarm.ts! - hh * 60).toString().padStart(2, '0');
    this.ts = `${hh}:${mm} (${diff} minuten geleden)`;
    this.startService.getStartDetails(flarm.START_ID!).then((start) =>
    {
        this.start = start;
        this.popup.open();
    });
  }

  closePopup() {
    this.popup.close();
  }
}
