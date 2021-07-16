import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {HeliosRecency} from "../../../types/Helios";

@Component({
  selector: 'app-recency',
  templateUrl: './recency.component.html',
  styleUrls: ['./recency.component.scss']
})
export class RecencyComponent implements OnInit, OnChanges {
  @Input() VliegerID: number;
  recency: HeliosRecency;

  constructor(private readonly startlijstService: StartlijstService) {
  }

  ngOnInit(): void {
    this.ophalen();
  }

  ophalen(): void {
    this.startlijstService.getRecency(this.VliegerID).then((r) => this.recency = r);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("VliegerID")) {
      this.ophalen()
    }
  }
}
