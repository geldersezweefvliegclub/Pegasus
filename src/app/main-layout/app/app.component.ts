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
    private keepAliveTimer: number;

    constructor(private readonly router: Router,
                private readonly loginService: LoginService,
                private readonly updates: SwUpdate) {

        updates.available.subscribe(() => this.updateAvailable = true);
        router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
                this.navigeerNaarLogin();
            }
        });

        // bij het opstarten zijn we miischien ingelogd. Deel dit met alle componenten
        if (this.isIngelogd) {
            setTimeout(() => loginService.successEmit(), 2000);
        }

        // nadat we ingelogd zijn, blijven we controleren of we ingelogd zijn, zo niet, dan loggen we uit
        loginService.inloggenSucces.subscribe(() => {
            this.keepAliveTimer = setInterval(() => {
               loginService.relogin().then((success) => {
                   if (!success) {                                          // niet meer ingelogd
                       clearInterval(this.keepAliveTimer);                  // dan ook stoppen met controleren

                       loginService.uitloggen();                            // verwijder inloginfo
                       this.router.navigate(['login']).then();    // ga noar login pagina
                   }
               })
            }, 1000*60 * 10);   // 10 minuten
        });
    }

  private navigeerNaarLogin() {
    this.isIngelogd = this.loginService.isIngelogd();

    if (!this.isIngelogd) {
      this.router.navigate(['login']).then();
    }
  }
}
