import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-icon-card',
  templateUrl: './icon-card.component.html',
  styleUrls: ['./icon-card.component.scss']
})
export class IconCardComponent {
  @Input() color: string = 'primary-color';
  @Input() icon : string = 'question-circle'
  @Input() titel: string;
  @Input() subtitel: string;
}
