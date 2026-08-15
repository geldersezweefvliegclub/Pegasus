import { Component } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faAddressCard } from '@fortawesome/free-solid-svg-icons';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';
import { TracksComponent } from '../../../shared/components/tracks/tracks.component';

@Component({
    selector: 'app-tracks-grid',
    templateUrl: './tracks-grid.component.html',
    styleUrls: ['./tracks-grid.component.scss'],
    imports: [PegasusCardComponent, TracksComponent]
})
export class TracksGridComponent {
  iconCardIcon: IconDefinition = faAddressCard;

  success: SuccessMessage | undefined;
  error: ErrorMessage | undefined;


}
