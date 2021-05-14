import {Component} from '@angular/core';
import {faCircleNotch} from '@fortawesome/free-solid-svg-icons';
import {LoginService} from '../../services/loginservice/login.service';

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
  error: Error | undefined;

  constructor(private readonly loginService: LoginService) {
  }

  login(): void {
    this.isLoading = true;
    this.loginService.login(this.gebruikersnaam, this.wachtwoord).then(() => {
      this.isLoading = false;
    }).catch(e => {
      this.error = e;
      this.isLoading = false;
    })
  }
}
