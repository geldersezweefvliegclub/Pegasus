import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-overlay-card',
  templateUrl: './overlay-card.component.html',
  styleUrls: ['./overlay-card.component.scss']
})
export class OverlayCardComponent {

  @Input() alignment = 'center';
  @Input() src = '';
  @Input() color = '';
}
