import { Component, OnInit } from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faBookReader} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-tracks-grid',
  templateUrl: './tracks-grid.component.html',
  styleUrls: ['./tracks-grid.component.scss']
})
export class TracksGridComponent implements OnInit {

  iconCardIcon: IconDefinition = faBookReader;

  constructor() { }

  ngOnInit(): void {
  }

}
