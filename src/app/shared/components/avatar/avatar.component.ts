import {Component, Input, ViewChild} from '@angular/core';
import {ModalComponent} from "../modal/modal.component";

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent {
  @Input() naam: string = "";
  @Input() url: string = "";

  @ViewChild(ModalComponent) private popup: ModalComponent;

  constructor() { }

  // Toon grote avatar in in popup window
  showPopup() {
    this.popup.open();
  }
}
