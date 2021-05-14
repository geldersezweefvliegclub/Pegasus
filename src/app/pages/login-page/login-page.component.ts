import {Component} from '@angular/core';
import {faCircleNotch} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  gebruikersnaam: string = '';
  wachtwoord: string = '';
  spinner = faCircleNotch;
  isLoading = false;

  constructor() {
  }

}
