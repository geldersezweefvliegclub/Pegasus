import {Component} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {UserService} from '../../services/userservice/user.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']

})

export class AppComponent {

  isIngelogd:boolean = this.loginService.isIngelogd();

  constructor(private readonly router: Router, private readonly loginService: UserService) {
    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.navigeerNaarLogin();
      }
    });
  }

  private navigeerNaarLogin() {
    if (!this.isIngelogd) {
      this.router.navigate(['login']).then();
    }
  }
}
