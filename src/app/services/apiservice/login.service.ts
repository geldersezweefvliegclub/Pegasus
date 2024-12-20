import { EventEmitter, Injectable } from '@angular/core';
import { APIService } from './api.service';

import { HeliosUserinfo } from '../../types/Helios';
import { StorageService } from '../storage/storage.service';
import { SharedService } from '../shared/shared.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DdwvService } from './ddwv.service';
import { KeyValueArray } from '../../types/Utils';

interface BearerToken {
    TOKEN: string;
}

@Injectable({
    providedIn: 'root'
})

export class LoginService  {
    userInfo: HeliosUserinfo | null = null;
    private userInfoStore = new BehaviorSubject(this.userInfo);
    public readonly userInfoChange = this.userInfoStore.asObservable();      // nieuwe userInfo beschikbaar

    inloggenSucces: EventEmitter<void> = new EventEmitter<void>();

    private dbEventAbonnement: Subscription;

    constructor(private readonly apiService: APIService,
                private readonly ddwwService: DdwvService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService) {

        // als we ons profiel aanpassen, dan moeten we userinfo ook aanpassen
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Leden") {
                if (ev.data.ID == this.userInfo?.LidData?.ID) {
                    this.getUserInfo().then(() => this.userInfoStore.next(this.userInfo))    // afvuren event
                }
            }
        });
    }

    isIngelogd(): boolean {
        if (this.userInfo == null) {
            if (this.storageService.ophalen("userInfo") == null) {
                return false;
            }
            this.userInfo = this.storageService.ophalen("userInfo") as HeliosUserinfo;
        }
        return true;
    }

    async login(gebruikersnaam: string, wachtwoord: string, token?: string): Promise<number | undefined> {
        const headers = new Headers(
        {
            'Authorization': 'Basic ' + btoa(`${gebruikersnaam}:${wachtwoord}`)
        });

        let params: KeyValueArray = {};
        if ((token) && (token !== "")) {
            params = {'token': token as string}
        }

        const response: Response = await this.apiService.get('Login/Login', params, headers);

        if (response.ok) {
            const login: BearerToken = await response.json();
            this.storageService.opslaan("bearer", login.TOKEN);
            this.apiService.setBearerToken(login.TOKEN);

            await this.getUserInfo();
            this.ddwwService.loadConfigDDWV();
            this.successEmit();

            return this.userInfo!.LidData!.ID;
        }
        return undefined;
    }

    // Haal nieuw token op zodat de sessie alive blijft
    async relogin(): Promise<boolean> {
        try {
            const response: Response = await this.apiService.get('Login/Relogin');
            if (response.ok) {
                const login: BearerToken = await response.json();

                this.storageService.opslaan("bearer", login.TOKEN);
                this.apiService.setBearerToken(login.TOKEN);
            }
        }
        catch (_) {
            this.apiService.setBearerToken();
            return false;
        }
        return true;
    }

    // Verstuur een mail met het nieuwe wachtwoord
    async resetWachtwoord(gebruikersnaam: string) {
        const headers = new Headers();
        const base64encoded = btoa(`${gebruikersnaam}:""`);
        headers.append('Authorization', `Basic ${base64encoded}`);

        await this.apiService.get('Login/ResetWachtwoord', undefined, headers);
    }

    // laat iedereen weten dat we ingelogd zijn, we wachten even zodat alle componenten geladen zijn
    // doen we dat niet, dan komt abbonement later dan event en missen het event
    successEmit() {
        setTimeout(() => this.inloggenSucces.emit(), 100);
    }

    async sendSMS(gebruikersnaam: string, wachtwoord: string): Promise<void> {
        const headers = new Headers();
        const base64encoded = btoa(`${gebruikersnaam}:${wachtwoord}`);
        headers.append('Authorization', `Basic ${base64encoded}`);

        await this.apiService.get('Login/SendSMS', undefined, headers);
    }

    async getUserInfo(): Promise<void> {
        const urlParams = "";

        const response: Response = await this.apiService.get('Login/GetUserInfo' + urlParams);
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
