import { Component } from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faAddressCard} from "@fortawesome/free-solid-svg-icons";
import {ErrorMessage, SuccessMessage} from "../../types/Utils";

@Component({
  selector: 'app-tracks-grid',
  templateUrl: './tracks-grid.component.html',
  styleUrls: ['./tracks-grid.component.scss']
})
export class TracksGridComponent {
  iconCardIcon: IconDefinition = faAddressCard;

  success: SuccessMessage | undefined;
  error: ErrorMessage | undefined;

  constructor() { }
}
