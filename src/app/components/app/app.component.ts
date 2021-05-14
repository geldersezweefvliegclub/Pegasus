import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {LoginService} from '../../services/loginservice/login.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private readonly router: Router, private readonly loginService: LoginService) {
    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.navigeerNaarLogin();
      }
    });
  }

  private navigeerNaarLogin() {
    if (!this.loginService.isIngelogd()) {
      this.router.navigate(['login']).then()
    }
  }
}
