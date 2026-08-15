import { Component } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faBars } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-hoofdscherm',
    templateUrl: './hoofdscherm.component.html',
    styleUrls: ['./hoofdscherm.component.scss'],
    standalone: false
})
export class HoofdschermComponent {
  readonly iconCardIcon: IconDefinition = faBars;
}
