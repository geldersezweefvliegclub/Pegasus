import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-voortgang',
    templateUrl: './voortgang.component.html',
    styleUrls: ['./voortgang.component.scss'],
    imports: [NgClass]
})
export class VoortgangComponent {
  readonly status = input.required<number>();
}
