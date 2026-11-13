import { Component, OnInit, inject } from '@angular/core';
import { LedenService } from '../../../services/apiservice/leden.service';
import { HeliosLedenDataset } from '../../../types/Helios';

@Component({
    selector: 'app-verjaardagen',
    templateUrl: './verjaardagen.component.html',
    styleUrls: ['./verjaardagen.component.scss']
})
export class VerjaardagenComponent implements OnInit {
  // variablen in html formulier
  protected verjaardagen: HeliosLedenDataset[] = [];

  // private variable voor ts script
  private readonly ledenService = inject(LedenService);

  ngOnInit(): void {
    this.ledenService.getVerjaardagen().then((dataset) => {
      this.verjaardagen = dataset;
    })
  }
}
