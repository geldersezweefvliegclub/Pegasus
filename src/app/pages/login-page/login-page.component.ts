import {Component, OnInit} from '@angular/core';
import {UserService} from '../../services/userservice/user.service';
import {CustomError} from '../../types/Utils';
import {Router} from "@angular/router";

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})

export class LoginPageComponent implements OnInit {
  gebruikersnaam: string = '';
  wachtwoord: string = '';
  secret: string = '';
  isLoading = false;
  showSecret: boolean = false;
  error: CustomError | undefined;
  toonFoto: number = 2; //Math.floor(Math.random() * 17)+1;

  constructor(private readonly loginService: UserService, private readonly router:Router) {
  }

  ngOnInit() {
    setInterval(() => { this.toonFoto = Math.floor(Math.random() * 17)+1}, 10000005000)
  }

  onSecurityCodeChanged(code: string) {
      this.secret = code;
  }

  login(): void {
    this.isLoading = true;
    this.loginService.login(this.gebruikersnaam, this.wachtwoord, this.secret).then(() => {
      this.isLoading = false;
      this.router.navigate(['/']);
    }).catch(e => {
      this.isLoading = false;

      if (e.responseCode == 406) {
        this.showSecret = true;
      }
      else {
        this.error = e;
      }
    })    
  }

  sendSMS(): void {
    this.isLoading = true;
    this.loginService.sendSMS(this.gebruikersnaam, this.wachtwoord).then(() => {
      this.isLoading = false;
    }).catch(e => {
      this.error = e;
      this.isLoading = false;
    })    
  }
}
