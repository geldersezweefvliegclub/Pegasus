import {Component} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {LoginService} from '../../services/apiservice/login.service';
import {SwUpdate} from "@angular/service-worker";

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.css']
})

export class AppComponent {
    isIngelogd: boolean = this.loginService.isIngelogd();
    updateAvailable: boolean = false;

    constructor(private readonly router: Router,
                private readonly loginService: LoginService,
                private readonly updates: SwUpdate) {

        updates.available.subscribe(() => this.updateAvailable = true);
        router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
                this.navigeerNaarLogin();
            }
        });

        // bij het opstarten zijn we reeds ingelogd. Deel dit met alle componenten
        if (this.isIngelogd) {
            setTimeout(() => loginService.successEmit(), 2000);
        }
    }

  private navigeerNaarLogin() {
    this.isIngelogd = this.loginService.isIngelogd();

    if (!this.isIngelogd) {
      this.router.navigate(['login']).then();
    }
  }
}
