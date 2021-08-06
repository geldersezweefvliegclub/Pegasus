import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {HeliosLogboekTotalen} from "../../../types/Helios";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {SharedService} from "../../../services/shared/shared.service";

@Component({
  selector: 'app-vlieger-logboek-totalen',
  templateUrl: './vlieger-logboek-totalen.component.html',
  styleUrls: ['./vlieger-logboek-totalen.component.scss']
})
export class VliegerLogboekTotalenComponent implements OnInit, OnChanges {
  @Input() VliegerID: number;

  datumAbonnement: Subscription;         // volg de keuze van de kalender
  datum: DateTime;                       // de gekozen dag
  data: HeliosLogboekTotalen;

  constructor(private readonly startlijstService: StartlijstService,
              private readonly sharedService: SharedService) {}

  ngOnInit(): void {
    // de datum zoals die in de kalender gekozen is
    this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
      this.datum = DateTime.fromObject({
        year: jaarMaand.year,
        month: jaarMaand.month,
        day: 1
      })
      this.opvragen();
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("VliegerID")) {
      this.opvragen()
    }
  }

  // opvragen van de totalen uit het vlieger logboek
  opvragen():void {
    if (this.datum) {
      this.startlijstService.getLogboekTotalen(this.VliegerID, this.datum.year).then((dataset) => {
        this.data = dataset;
      });
    }
  }

}
