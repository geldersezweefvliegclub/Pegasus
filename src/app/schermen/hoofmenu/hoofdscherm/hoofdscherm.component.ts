import { Component } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { NavigatieComponent } from '../../../shared/components/navigatie/navigatie.component';
import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';

@Component({
    selector: 'app-hoofdscherm',
    templateUrl: './hoofdscherm.component.html',
    styleUrls: ['./hoofdscherm.component.scss'],
    imports: [NavigatieComponent, PegasusCardComponent]
})
export class HoofdschermComponent {
  readonly iconCardIcon: IconDefinition = faBars;
}
