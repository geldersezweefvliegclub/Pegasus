import { Component, OnInit, ViewChild } from '@angular/core';
import { LoginService } from '../../../services/apiservice/login.service';
import { ErrorMessage } from '../../../types/Utils';
import { Router } from '@angular/router';

import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { CodeInputComponent } from 'angular-code-input';
import { StorageService } from '../../../services/storage/storage.service';
import { PegasusConfigService } from '../../../services/shared/pegasus-config.service';
import { LedenService } from '../../../services/apiservice/leden.service';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss']
})

export class LoginPageComponent implements OnInit {
    @ViewChild(CodeInputComponent) private codeInput: CodeInputComponent;

    oogIcon: IconDefinition = faEye;

    privacyUrl : string | undefined;
    privacyOk: boolean;

    gebruikersnaam = '';
    wachtwoord = '';
    wachtwoordVerborgen = true;

    showSecret = false;
    secret = '';
    isLoading = false;
    error: ErrorMessage;

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
        "/assets/img/50832.jpg",
        "/assets/img/20201025.jpg",
        "/assets/img/20201025.jpg"
    ];
    toonFoto: string = this.urlFoto();

    constructor(private readonly loginService: LoginService,
                private readonly ledenService: LedenService,
                private readonly configService: PegasusConfigService,
                private readonly storageService: StorageService,
                private readonly router: Router) {
    }

    ngOnInit() {
        setInterval(() => {
            this.toonFoto = this.urlFoto()
        }, 15000)

        this.privacyOk = this.storageService.ophalen("privacyOk") == "true";
        this.privacyUrl = this.configService.privacyURL();
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
        this.loginService.login(this.gebruikersnaam, this.wachtwoord, this.secret).then((ID) => {
            this.isLoading = false;
            this.storageService.opslaan("privacyOk", "true", 60 * 24 * 90);     // 90 dagen
            this.ledenService.syncSynapse(ID!, this.wachtwoord)

            const url = (this.storageService.ophalen("url")) ? this.storageService.ophalen("url") : "/";
            this.router.navigate([url]);
        }).catch(e => {
            this.isLoading = false;

            if (e.responseCode == 406) {
                this.showSecret = true;

                // kleine timeout om component eerst zichtbaar te maken
                setTimeout(() => this.codeInput.focusOnField(0), 250)

            } else {
                this.error = e;
            }
        })
    }

    verbergWachtwoord() {
        this.wachtwoordVerborgen = !this.wachtwoordVerborgen;
        this.oogIcon = this.wachtwoordVerborgen ? faEye : faEyeSlash;
    }

    showLostPassword(): boolean {
        return this.gebruikersnaam.length > 2;
    }

    // Als je geen Google authenticator hebt, kan de code per SMS verstuurd worden door het backend
    sendSMS(): void {
        this.isLoading = true;
        this.loginService.sendSMS(this.gebruikersnaam, this.wachtwoord).then(() => {
            this.isLoading = false;
            this.secret = '';
            alert("U ontvangt spoedig een SMS met de inlogcode.");
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        })
    }

    // stuur een email met nieuw wachtwoord
    recoverEmail() {
        this.loginService.resetWachtwoord(this.gebruikersnaam).then(() => alert("Een email met het nieuwe wachtwoord is verstuurd"));
    }
}
