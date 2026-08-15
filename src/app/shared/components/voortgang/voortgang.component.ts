import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-voortgang',
    templateUrl: './voortgang.component.html',
    styleUrls: ['./voortgang.component.scss'],
    standalone: false
})
export class VoortgangComponent {
  @Input() status: number;
}
