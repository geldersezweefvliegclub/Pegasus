import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { FacturenService } from '../../../services/apiservice/facturen.service';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import {TransactiesService} from "../../../services/apiservice/transacties.service";
import {HeliosTransactiesDataset} from "../../../types/Helios";
import {DateTime} from "luxon";
import { ErrorComponent } from '../error/error.component';
import { NgbProgressbar } from '@ng-bootstrap/ng-bootstrap';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
    selector: 'app-factuur-uploaden',
    templateUrl: './uploaden.component.html',
    styleUrls: ['./uploaden.component.scss'],
    imports: [ErrorComponent, ModalComponent, NgbProgressbar, IconButtonComponent]
})
export class FactuurUploadenComponent implements OnInit {
  private readonly facturenService = inject(FacturenService);
  private readonly transactiesService = inject(TransactiesService);

  @ViewChild(ModalComponent) private popup: ModalComponent;

  isBezig: boolean;
  isKlaar: boolean;
  counter: number;
  max: number;
  private IDs: number[] = [];

  private transacties: HeliosTransactiesDataset[] = [];

  success: SuccessMessage | undefined;
  error: ErrorMessage | undefined;

  ngOnInit(): void {
    this.isBezig = false;
    this.isKlaar = false;
  }

  // Contributie en facturen factuur-uploaden
  showPopupAndUploadFacturen(IDs: number[]) {
    this.popup.open();
    this.IDs = IDs;
    this.counter = 0;
    this.max = IDs.length;
    this.isBezig = true;
    this.isKlaar = false;

    this.uploadEnkeleFactuur(0);
  }

  // DDWV facturen factuur-uploaden vanuit transacties
  showPopupAndUploadTransacties(transacties: HeliosTransactiesDataset[], datum: DateTime) {

    if (transacties.length > 0)
    {
      this.transacties = transacties;

      this.popup.open();
      this.counter = 0;
      this.isBezig = true;
      this.isKlaar = false;

      this.transacties.forEach(transactie => {
        if (transactie.LID_ID)
        {
          if (!this.IDs.includes(transactie.LID_ID))
          {
            this.IDs.push(transactie.LID_ID);
          }
        }
      })
      this.max = this.IDs.length;
      this.uploadEnkeleTransactieFactuur(0, datum);
    }
  }

  uploadEnkeleFactuur(sequence: number)
  {
    this.counter = sequence + 1;
    this.facturenService.uploadFactuur(this.IDs[sequence]).then(() => {
      if (this.counter < this.IDs.length) {
        this.uploadEnkeleFactuur(this.counter)
      }
      else {
        this.isBezig = false;
        this.isKlaar = true;
      }
    }).catch(e => {
      this.isBezig = false;
      this.isKlaar = true;
      this.counter--;
      this.error = e;
    });
  }

  uploadEnkeleTransactieFactuur(sequence: number, datum: DateTime)
  {
    this.counter = sequence + 1;
    this.facturenService.uploadTransactieFactuur(this.IDs[sequence], datum).then(() => {
      if (this.counter < this.IDs.length) {
        this.uploadEnkeleTransactieFactuur(this.counter, datum)
      }
      else {
        this.isBezig = false;
        this.isKlaar = true;
      }
    }).catch(e => {
      this.isBezig = false;
      this.isKlaar = true;
      this.counter--;
      this.error = e;
    });
  }

  closePopup() {
    this.popup.close();
  }
}
