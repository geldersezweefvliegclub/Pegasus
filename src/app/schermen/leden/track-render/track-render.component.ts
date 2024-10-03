import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faAddressCard } from '@fortawesome/free-solid-svg-icons';
import { ICellRendererParams } from 'ag-grid-community';

interface onTrackClicked {
    onTrackClicked(id: string, naam: string): void;
}
@Component({
  selector: 'app-track-render',
  templateUrl: './track-render.component.html',
  styleUrls: ['./track-render.component.scss']
})
export class TrackRenderComponent implements AgRendererComponent {
  private params: ICellRendererParams & onTrackClicked;
  trackIcon: IconDefinition = faAddressCard;

  agInit(params: ICellRendererParams & onTrackClicked): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

  buttonClicked() {
    this.params.onTrackClicked(this.params.data.ID, this.params.data.NAAM);
  }
}
