import {Component} from '@angular/core';
import {faInfo} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-profile1',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent {
  informatieIcon = faInfo;

  submit() {

  }
}
