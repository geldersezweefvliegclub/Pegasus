import {Component, OnInit} from '@angular/core';
import {faPlane} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-leden-grid',
  templateUrl: './leden-grid.component.html',
  styleUrls: ['./leden-grid.component.scss']
})
export class LedenGridComponent {
  plane = faPlane;
}
