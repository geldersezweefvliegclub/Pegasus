import {EventEmitter, Injectable} from '@angular/core';
import {APIService} from './api.service';
import {Base64} from 'js-base64';

import {HeliosUserinfo} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {SharedService} from "../shared/shared.service";

interface BearerToken {
    TOKEN: string;
}

@Injectable({
    providedIn: 'root'
})

export class LoginService {
    userInfo: HeliosUserinfo | null = null;
    inloggenSucces: EventEmitter<void> = new EventEmitter<void>();

    constructor(private readonly APIService: APIService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService) {
    }

    isIngelogd(): boolean {
        if (this.userInfo == null) {
            if (this.storageService.ophalen("userInfo") == null) {
                return false;
            }
            this.userInfo = this.storageService.ophalen("userInfo");
        }
        return true;
    }

    async login(gebruikersnaam: string, wachtwoord: string, token?: string): Promise<void> {
        const headers = new Headers(
    {
            'Authorization': 'Basic ' + Base64.encode(`${gebruikersnaam}:${wachtwoord}`)
        });

        let params: any;
        if ((token) && (token !== "")) {
            params = {'token': token as string}
        }

        const response: Response = await this.APIService.get('Login/Login', params, headers);

        if (response.ok) {
            const login: BearerToken = await response.json();
            this.storageService.opslaan("bearer", login.TOKEN);
            this.APIService.setBearerToken(login.TOKEN);

            await this.getUserInfo();
            this.successEmit();
        }
    }

    // Haal nieuw token op zodat de sessie alive blijft
    async relogin(): Promise<boolean> {
        try {
            const response: Response = await this.APIService.get('Login/Relogin');
            if (response.ok) {
                const login: BearerToken = await response.json();

                this.storageService.opslaan("bearer", login.TOKEN);
                this.APIService.setBearerToken(login.TOKEN);
            }
        }
        catch (e) {
            this.APIService.setBearerToken();
            return false;
        }
        return true;
    }


    // laat iedereen weten dat we ingelogd zijn, we wachten even zodat alle componenten geladen zijn
    // doen we dat niet, dan komt abbonement later dan event en missen het event
    successEmit() {
        setTimeout(() => this.inloggenSucces.emit(), 100);
    }

    async sendSMS(gebruikersnaam: string, wachtwoord: string): Promise<void> {

        const headers = new Headers();
        const base64encoded = Base64.encode(`${gebruikersnaam}:${wachtwoord}`);
        headers.append('Authorization', `Basic ${base64encoded}`);

        await this.APIService.get('Login/SendSMS', undefined, headers);
    }

    async getUserInfo(datum?: Date): Promise<void> {

        let urlParams: string = "";
        if (datum) {
            urlParams = "?DATUM=" + datum.toISOString().split('T')[0];
        }

        const response: Response = await this.APIService.get('Login/GetUserInfo' + urlParams);
        if (response.ok) {
            this.userInfo = await response.json();
            this.storageService.opslaan("userInfo", this.userInfo);
        }
    }

    uitloggen(): void {
        this.userInfo = null;
        this.storageService.verwijder("userInfo");
        this.storageService.verwijder("bearer");
    }
}
