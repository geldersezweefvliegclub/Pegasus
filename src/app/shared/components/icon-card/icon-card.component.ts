import {Component, Input} from '@angular/core';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-icon-card',
  templateUrl: './icon-card.component.html',
  styleUrls: ['./icon-card.component.scss']
})
export class IconCardComponent {
  @Input() icon : IconDefinition = faQuestionCircle
  @Input() titel: string;
  @Input() subtitel: string;
}
