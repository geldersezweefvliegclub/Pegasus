import { Component, Input, ViewChild, input } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { LazyLoadImageModule } from 'ng-lazyload-image';

@Component({
    selector: 'app-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss'],
    imports: [LazyLoadImageModule, ModalComponent]
})
export class AvatarComponent {
  readonly naam = input.required();
  @Input() url = '';
  readonly vorm = input<'cirkel' | 'vierkant'>('cirkel');
  @ViewChild(ModalComponent) private popup: ModalComponent;


  // Toon grote avatar in popup window
  showPopup() {
    this.popup.open();
  }

  closePopup() {
    this.popup.close();
  }
}
