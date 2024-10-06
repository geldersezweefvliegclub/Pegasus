import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { FacturenService } from '../../../../services/apiservice/facturen.service';
import { ErrorMessage, SuccessMessage } from '../../../../types/Utils';

@Component({
  selector: 'app-uploaden',
  templateUrl: './uploaden.component.html',
  styleUrls: ['./uploaden.component.scss']
})
export class UploadenComponent implements OnInit {
  @ViewChild(ModalComponent) private popup: ModalComponent;

  isBezig: boolean;
  isKlaar: boolean;
  counter: number;
  max: number;
  IDs: number[] = [];

  success: SuccessMessage | undefined;
  error: ErrorMessage | undefined;

  constructor(private readonly facturenService: FacturenService) { }

  ngOnInit(): void {
    this.isBezig = false;
    this.isKlaar = false;
  }

  // Toon voortgang
  showPopupAndUpload(IDs: number[]) {
    this.popup.open();
    this.IDs = IDs;
    this.counter = 0;
    this.max = IDs.length;
    this.isBezig = true;
    this.isKlaar = false;

    this.uploadEnkeleFactuur(0);
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

  closePopup() {
    this.popup.close();
  }
}
