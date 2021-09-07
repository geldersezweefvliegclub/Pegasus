import {Component, Input, ViewChild} from '@angular/core';
import {ModalComponent} from '../modal/modal.component';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent {
  @Input() naam: string = '';
  @Input() url: string = '';
  @Input() vorm: 'cirkel' | 'vierkant' = 'cirkel';
  @ViewChild(ModalComponent) private popup: ModalComponent;


  // Toon grote avatar in popup window
  showPopup() {
    this.popup.open();
  }

  closePopup() {
    this.popup.close();
  }
}
