import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import { LoginService } from '../../services/apiservice/login.service';
import { SwUpdate } from '@angular/service-worker';
import { debounceTime } from 'rxjs/operators';
import { SharedService } from '../../services/shared/shared.service';
import { StorageService } from '../../services/storage/storage.service';
import { PopupKalenderComponent } from '../../shared/components/popup-kalender/popup-kalender.component';
import { NavigatieComponent } from '../../shared/components/navigatie/navigatie.component';
import { IconButtonComponent } from '../../shared/components/icon-button/icon-button.component';
import { NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    imports: [NavigatieComponent, IconButtonComponent, PopupKalenderComponent, RouterOutlet]
})

export class AppComponent implements OnDestroy{
    readonly router = inject(Router);
    private readonly updates = inject(SwUpdate);
    private readonly calendar = inject(NgbCalendar);
    readonly loginService = inject(LoginService);
    private readonly sharedService = inject(SharedService);
    private readonly storageService = inject(StorageService);

    @ViewChild(PopupKalenderComponent) popupKalender: PopupKalenderComponent;

    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender

    vandaag = this.calendar.getToday();
    datumDMY: string = this.vandaag.day + "-" + this.vandaag.month + "-" + this.vandaag.year;

    isIngelogd: boolean = this.loginService.isIngelogd();
    heeftStartVerbod = false;
    contactBeheerderDDWV = false
    zusterclubOntbreekDDWV = false;
    updateAvailable = false;
    private keepAliveTimer: number;

    constructor() {
        const router = this.router;
        const loginService = this.loginService;


        // Service worker update, but only in production. During development, the service worker is disabled which results in an error.
        // Enabling the service worker would result in a lot of caching, which is not desired during development because it would be hard to test changes.
        if (this.updates.isEnabled) {
            this.updates.checkForUpdate().then((hasUpdate) => {
                this.updateAvailable = hasUpdate;
            });
        }
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
            if (this.loginService.userInfo) {
                const ui = this.loginService.userInfo?.LidData;
                this.heeftStartVerbod = (ui!.LIDTYPE_ID != 625 && ui!.STARTVERBOD!);
                this.contactBeheerderDDWV = (ui!.LIDTYPE_ID == 625 && ui!.STARTVERBOD!);
                this.zusterclubOntbreekDDWV = (ui!.LIDTYPE_ID == 625 && ui!.ZUSTERCLUB_ID == undefined)
            }

            this.keepAliveTimer = window.setInterval(() => {
                loginService.relogin().then((success) => {
                    if (!success) {                                          // niet meer ingelogd
                        clearInterval(this.keepAliveTimer);                  // dan ook stoppen met controleren

                        loginService.uitloggen();                            // verwijder inloginfo
                        this.router.navigate(['login']).then();    // ga noar login pagina
                    }

                    const ui = this.loginService.userInfo?.LidData;
                    this.heeftStartVerbod = (ui!.LIDTYPE_ID != 625 && ui!.STARTVERBOD!);
                    this.contactBeheerderDDWV = (ui!.LIDTYPE_ID == 625 && ui!.STARTVERBOD!);
                    this.zusterclubOntbreekDDWV = (ui!.LIDTYPE_ID == 625 && ui!.ZUSTERCLUB_ID == undefined)

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

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.datumDMY =  "1-" + jaarMaand.month + "-" + jaarMaand.year;
            }
        });

        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datumDMY = datum.day + "-" + datum.month + "-" + datum.year;
        });
    }

    ngOnDestroy(): void {
        this.maandAbonnement.unsubscribe();
        this.datumAbonnement.unsubscribe();
    }

    // ga noar hoofdscherm pagina, alleen voor toepassing bij kleine schermen
    hoofdmenu() {
        this.router.navigate(['hoofdscherm']).then();
    }

    private navigeerNaarLogin() {
        this.isIngelogd = this.loginService.isIngelogd();

        if (!this.isIngelogd) {
            this.heeftStartVerbod = false;
            this.router.navigate(['login']).then();
        }
    }

    // Er is een nieuwe software update en de gebruiker wil deze software gebruiken
    applyUpdate() {
        this.updates.activateUpdate().then(() => document.location.reload());
    }
}
