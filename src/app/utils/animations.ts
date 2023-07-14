import {animate, AnimationTriggerMetadata, style, transition, trigger} from "@angular/animations";

/**
 * Animeer een element door hem links naar binnen te sliden wanneer hij wordt getoond, en daarna links uit te sliden voordat het element onzichtbaar wordt.
 * De animatie moet worden gebruikt met de NAAM van de animatie. NIET de naam van de VARIABELE waar deze animatie in gedeclareerd staat
 * @example
 * // In your component.ts:
 * @Component({
 *   selector: 'app-your-component',
 *   templateUrl: './your-component.component.html',
 *   styleUrls: ['./your-component.component.css'],
 *   animations: [
 *     <!-- Register slideInOutLeft variable, but when using the animation the 'name' property inside this variable actually matters-->
 *     slideInOutLeftAnimation
 *   ]
 * })
 * export class YourComponent {
 *   isElementVisible = false
 *   // Component code...
 * }
 *  <!-- In your-component.component.html -->
 *  <div [@slideInOutLeft]="isElementVisible" *ngIf="isElementVisible">
 *     <!-- Your element content goes here -->
 *  </div>
 */
export const slideInOutLeftAnimation: AnimationTriggerMetadata = trigger('slideInOutLeft', [
    transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('0.3s ease-out', style({ transform: 'translateX(0%)' }))
    ]),
    transition(':leave', [
        style({ transform: 'translateX(0%)' }),
        animate('0.3s ease-out', style({ transform: 'translateX(-100%)' }))
    ])
]);