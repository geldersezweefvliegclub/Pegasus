import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ModalComponent} from "../modal/modal.component";
import {journaalFilter, JournaalService} from "../../../services/apiservice/journaal.service";
import {HeliosJournaalDataset} from "../../../types/Helios";
import {DateTime} from "luxon";
import {Subscription} from "rxjs";
import {SharedService} from "../../../services/shared/shared.service";

@Component({
  selector: 'app-popup-journaal',
  templateUrl: './popup-journaal.component.html',
  styleUrls: ['./popup-journaal.component.scss']
})
export class PopupJournaalComponent implements OnInit, OnDestroy {
  @ViewChild(ModalComponent) private popup: ModalComponent;

  data:HeliosJournaalDataset[] = [];

  private datumAbonnement: Subscription;      // volg de keuze van de kalender
  private maandAbonnement: Subscription;      // volg de keuze van de kalender
  private vliegtuigID:  number;
  datum: DateTime = DateTime.now();           // de gekozen dag
  isLoading = false;

  constructor(private readonly sharedService: SharedService,
              private readonly journaalService: JournaalService) {
  }

  ngOnInit(): void {
    // Op safari hebben we een korte vertraging nodig op te zorgen dat initialisatie gedaan is
    setTimeout(() => {
      // de datum zoals die in de kalender gekozen is
      this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
        this.datum = DateTime.fromObject({
          year: datum.year,
          month: datum.month,
          day: datum.day
        })
      });

      // de datum zoals die in de kalender gekozen is
      this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
        if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
          this.datum = DateTime.fromObject({
            year: jaarMaand.year,
            month: jaarMaand.month,
            day: 1
          })
        }
      })
    }, 250);
  }

  ngOnDestroy(): void
  {
    if (this.maandAbonnement)       this.maandAbonnement.unsubscribe();
    if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
  }

  showPopup(ID: number) {
    this.vliegtuigID = ID;
    this.opvragen();
    this.popup.open();
  }

  closePopup() {
    this.popup.close();
  }

  opvragen() : void {
    if (this.vliegtuigID) {
      const startDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 1, day: 1});
      const eindDatum: DateTime = DateTime.fromObject({year: this.datum.year, month: 12, day: 31});
      this.isLoading = true;

      const filter: journaalFilter = {
        alleenVliegtuigen: false,
        alleenRollend: false,

        selectedVliegtuigen: [this.vliegtuigID],
        selectedRollend: [],
        selectedCategorie: [],
        selectedStatus: []
      }
      this.journaalService.getJournaals(filter, startDatum, eindDatum).then((data) => {
        this.data = data;
        this.isLoading = false;
      })
    }
  }
}