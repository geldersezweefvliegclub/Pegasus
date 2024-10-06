import { Component, OnInit } from '@angular/core';
import { LedenService } from '../../../services/apiservice/leden.service';
import { HeliosLedenDataset } from '../../../types/Helios';

@Component({
  selector: 'app-verjaardagen',
  templateUrl: './verjaardagen.component.html',
  styleUrls: ['./verjaardagen.component.scss']
})
export class VerjaardagenComponent implements OnInit {

  constructor(private readonly ledenService: LedenService) { }

  verjaardagen: HeliosLedenDataset[] = [];

  ngOnInit(): void {
    this.ledenService.getVerjaardagen().then((dataset) => {
      this.verjaardagen = dataset;
    })
  }
}
