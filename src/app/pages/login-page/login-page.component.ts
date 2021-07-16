import {Component, OnInit} from '@angular/core';
import {LoginService} from '../../services/apiservice/login.service';
import {CustomError} from '../../types/Utils';
import {Router} from '@angular/router';

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

    fotoAlbum = [
        "/assets/img/15143.jpg",
        "/assets/img/17424.jpg",
        "/assets/img/17552.jpg",
        "/assets/img/17924.jpg",
        "/assets/img/18473.jpg",
        "/assets/img/18498.jpg",
        "/assets/img/19172.jpg",
        "/assets/img/19348.jpg",
        "/assets/img/19715.jpg",
        "/assets/img/17424.jpg",
        "/assets/img/17562.jpg",
        "/assets/img/18455.jpg",
        "/assets/img/18492.jpg",
        "/assets/img/18500.jpg",
        "/assets/img/19218.jpg",
        "/assets/img/19507.jpg",
        "/assets/img/50832.jpg"
    ];
  toonFoto: string = this.urlFoto();

  constructor(private readonly loginService: LoginService, private readonly router:Router) {
  }

  ngOnInit() {
    setInterval(() => { this.toonFoto = this.urlFoto()}, 15000)
  }

  // geef de url terug van een willekeurige foto
  urlFoto(): string {
      const index = Math.floor(Math.random() * this.fotoAlbum.length)
      return this.fotoAlbum[index];
  }

  // De Google authenticator is aangepast. Variable opslaan in this.secret
  onSecurityCodeChanged(code: string) {
      this.secret = code;
  }

  // Nu gaan we inloggen
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

  // Als je geen Google authenticator hebt, kan de code per SMS verstuurd worden door het backend
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
