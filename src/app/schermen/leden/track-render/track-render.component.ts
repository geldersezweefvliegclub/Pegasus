import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faAddressCard } from '@fortawesome/free-solid-svg-icons';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-track-render',
  templateUrl: './track-render.component.html',
  styleUrls: ['./track-render.component.scss']
})
export class TrackRenderComponent implements AgRendererComponent {
  private params: any;
  trackIcon: IconDefinition = faAddressCard;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  buttonClicked() {
    this.params.onTrackClicked(this.params.data.ID, this.params.data.NAAM);
  }
}
