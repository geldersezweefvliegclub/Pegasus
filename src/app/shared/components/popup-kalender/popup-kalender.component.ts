import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
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

  @ViewChild(ModalComponent) private popup: ModalComponent;

  private datumAbonnement: Subscription;

  ngOnInit() : void {
    this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(() => {
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
