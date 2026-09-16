import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../services/shared/shared.service';
import { VliegdagSelectieComponent } from '../vliegdag-selectie/vliegdag-selectie.component';

@Component({
    selector: 'app-popup-kalender',
    templateUrl: './popup-kalender.component.html',
    styleUrls: ['./popup-kalender.component.scss'],
    imports: [ModalComponent, VliegdagSelectieComponent]
})
export class PopupKalenderComponent implements OnInit, OnDestroy {
  private readonly sharedService = inject(SharedService);

  private readonly popup = viewChild.required(ModalComponent);

  private datumAbonnement: Subscription;

  ngOnInit() : void {
    this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(() => {
      const popup = this.popup();
      if (popup !== undefined) {
        popup.close();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
  }

  // Open dialoog met de kalender
  openPopup() {
    this.popup().open();
  }


}
