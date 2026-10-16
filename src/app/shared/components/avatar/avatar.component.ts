import { Component, Input, input, viewChild } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { LazyLoadImageModule } from 'ng-lazyload-image';

@Component({
    selector: 'app-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss'],
    imports: [LazyLoadImageModule, ModalComponent]
})
export class AvatarComponent {
  readonly naam = input<string>('');      // titel van de popup, optioneel
  @Input() url = '';
  readonly vorm = input<'cirkel' | 'vierkant'>('cirkel');
  private readonly popup = viewChild.required(ModalComponent);


  // Toon grote avatar in popup window. Zonder avatar staat er een standaard symbool, dan geen popup
  showPopup() {
    if (!this.url) return;
    this.popup().open();
  }

  closePopup() {
    this.popup().close();
  }
}
