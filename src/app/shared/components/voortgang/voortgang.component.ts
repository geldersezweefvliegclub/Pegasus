import { Component, input } from '@angular/core';


@Component({
    selector: 'app-voortgang',
    templateUrl: './voortgang.component.html',
    styleUrls: ['./voortgang.component.scss']
})
export class VoortgangComponent {
  readonly status = input.required<number>();
}
