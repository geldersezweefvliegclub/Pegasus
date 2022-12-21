import {Component} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {LoginService} from '../../services/apiservice/login.service';
import {SwUpdate} from "@angular/service-worker";
import {debounceTime} from "rxjs/operators";
import {SharedService} from "../../services/shared/shared.service";
import {StorageService} from "../../services/storage/storage.service";

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.css']
})

export class AppComponent {
    isIngelogd: boolean = this.loginService.isIngelogd();
    heeftStartVerbod = false;
    updateAvailable: boolean = false;
    private keepAliveTimer: number;

    constructor(private readonly router: Router,
                private readonly updates: SwUpdate,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService) {

        updates.versionUpdates.subscribe(() => this.updateAvailable = true);
        router.events.subscribe((val) => {
            if (router.url != "/login") {
                this.storageService.opslaan("url", router.url, 5)
            }

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
            const ui = this.loginService.userInfo?.LidData;
            this.heeftStartVerbod = ui!.STARTVERBOD!;

            this.keepAliveTimer = window.setInterval(() => {
                loginService.relogin().then((success) => {
                    if (!success) {                                          // niet meer ingelogd
                        clearInterval(this.keepAliveTimer);                  // dan ook stoppen met controleren

                        loginService.uitloggen();                            // verwijder inloginfo
                        this.router.navigate(['login']).then();    // ga noar login pagina
                    }
                })
            }, 1000 * 60 * 10);   // 10 minuten
        });

        // We houden failure van api bij. Als we zien dat de server ons niet meer kent = error 501
        // doordat bijvoorbeeld de computer in slaapstand is geweest, dan loggen we uit
        this.sharedService.heliosEventFailed.pipe(debounceTime(1000)).subscribe(error => {
            if (error.responseCode == 501) {
                clearInterval(this.keepAliveTimer);                  // stoppen met controleren

                loginService.uitloggen();                            // verwijder inloginfo
                this.router.navigate(['login']).then();    // ga noar login pagina
            }
        });
    }

    private navigeerNaarLogin() {
        this.isIngelogd = this.loginService.isIngelogd();

        if (!this.isIngelogd) {
            this.heeftStartVerbod = false;
            this.router.navigate(['login']).then();
        }
    }
}
