import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ModalComponent} from "../modal/modal.component";
import {Subscription} from "rxjs";
import {SharedService} from "../../../services/shared/shared.service";
import {debounceTime} from "rxjs/operators";

@Component({
  selector: 'app-popup-kalender',
  templateUrl: './popup-kalender.component.html',
  styleUrls: ['./popup-kalender.component.scss']
})
export class PopupKalenderComponent implements OnInit, OnDestroy {
  @ViewChild(ModalComponent) private popup: ModalComponent;

  private datumAbonnement: Subscription;          // volg de keuze van de kalender

  constructor(private readonly sharedService: SharedService) { }

  ngOnInit() : void {
    this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
      if (this.popup !== undefined) {
        this.popup.close();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
  }

  // Open dialoog met de kalender
  openPopup() {
    this.popup.open();
  }


}
