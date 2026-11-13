import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faAddressCard } from '@fortawesome/free-solid-svg-icons';
import { ICellRendererParams } from 'ag-grid-community';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

interface onTrackClicked {
    onTrackClicked(id: string, naam: string): void;
}
@Component({
    selector: 'app-track-render',
    templateUrl: './track-render.component.html',
    styleUrls: ['./track-render.component.scss'],
    imports: [FaIconComponent]
})
export class TrackRenderComponent implements AgRendererComponent {
  // variablen in html formulier
  protected trackIcon: IconDefinition = faAddressCard;

  // private variable voor ts script
  private params: ICellRendererParams & onTrackClicked;

  agInit(params: ICellRendererParams & onTrackClicked): void {
    this.params = params;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }

  protected buttonClicked() {
    this.params.onTrackClicked(this.params.data.ID, this.params.data.NAAM);
  }
}
