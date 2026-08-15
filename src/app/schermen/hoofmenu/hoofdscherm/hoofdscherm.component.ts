import { Component } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { SharedModule } from '../../../shared/shared.module';

@Component({
    selector: 'app-hoofdscherm',
    templateUrl: './hoofdscherm.component.html',
    styleUrls: ['./hoofdscherm.component.scss'],
    imports: [SharedModule]
})
export class HoofdschermComponent {
  readonly iconCardIcon: IconDefinition = faBars;
}
