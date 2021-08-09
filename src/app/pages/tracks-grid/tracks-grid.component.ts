import { Component } from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faAddressCard} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-tracks-grid',
  templateUrl: './tracks-grid.component.html',
  styleUrls: ['./tracks-grid.component.scss']
})
export class TracksGridComponent {

  iconCardIcon: IconDefinition = faAddressCard;

  constructor() { }
}
