import { Injectable } from '@angular/core';
import { APIService } from './api.service';

import { HeliosLeden, HeliosLedenDataset, HeliosLid } from '../../types/Helios';
import { KeyValueArray } from '../../types/Utils';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SharedService } from '../shared/shared.service';
import { LoginService } from './login.service';
import { CustomJsonSerializer } from '../../utils/Utils';

@Injectable({
    providedIn: 'root'
})
export class LedenService {
    private ledenCache: HeliosLeden  = { dataset: []};       // return waarde van API call

    private overslaan = false;
    private ophaalTimer: number;                                // Iedere 15 min halen we de leden op
    private fallbackTimer: number;                              // Timer om te zorgen dat starts geladen echt is
    private ledenStore = new BehaviorSubject(this.ledenCache.dataset);
    private dbEventAbonnement: Subscription;
    public readonly ledenChange = this.ledenStore.asObservable();      // nieuwe leden beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {

        // nadat we ingelogd zijn kunnen we de vliegtuigen ophalen
        loginService.inloggenSucces.subscribe(() => {
            this.ophalenLeden().then(() => {
                this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
            });
        });

        this.ophaalTimer = window.setInterval(() => {
            this.ophalenLeden().then(() => {
                this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
            });
        }, 1000 * 60 * 15);

        // Deze timer kijkt periodiek of de starts er is. API call bij inloggen kan mislukt zijn dus dit is de fallback
        this.fallbackTimer = window.setInterval(() => {
            if (this.loginService.isIngelogd()) {
                let ophalen = false;
                if (this.ledenCache === undefined) {
                    ophalen = true
                } else if (this.ledenCache.dataset!.length < 1) {
                    ophalen = true;
                }
                if (ophalen) {
                    this.ophalenLeden().then(() => {
                        this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
                    });
                }
            }
        }, 1000 * 60);  // iedere minuut

        // Als leden zijn aangepast, dan moeten we overzicht opnieuw ophalen
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Leden") {
                this.ophalenLeden().then(() => {
                    this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
                });
            }
        });
    }

    private async ophalenLeden(): Promise<HeliosLedenDataset[]> {
        if (this.overslaan) {
            return this.ledenCache?.dataset as HeliosLedenDataset[];
        }
        this.overslaan = true;
        setTimeout(() => this.overslaan = false, 1000 * 5)
        return await this.getLeden();
    }

    async getLeden(verwijderd = false, zoekString?: string): Promise<HeliosLedenDataset[]> {
        const getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.ledenCache != undefined)  && (this.ledenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.ledenCache.hash;
        }
        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }
        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.apiService.get('Leden/GetObjects', getParams);

            this.ledenCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.ledenCache?.dataset as HeliosLedenDataset[];
    }

    async getLid(id: number): Promise<HeliosLid> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }
        const response: Response = await this.apiService.get('Leden/GetObject', {'ID': id.toString()});
        return response.json();
    }

    async addLid(lid: HeliosLid) {
        const response: Response  = await this.apiService.post('Leden/SaveObject', JSON.stringify(lid));
        const dbLid = await response.json();
        this.syncSynapse(dbLid.ID!, lid.WACHTWOORD);
        return dbLid;
    }

    async updateLid(lid: HeliosLid) {
        const response: Response = await this.apiService.put('Leden/SaveObject', JSON.stringify(lid, CustomJsonSerializer));
        this.syncSynapse(lid.ID!, lid.WACHTWOORD)
        return response.json();
    }

    async deleteLid(id: number) {
        await this.apiService.delete('Leden/DeleteObject', {'ID': id.toString()});
        this.syncSynapse(id)
    }

    async restoreLid(id: number) {
        await this.apiService.patch('Leden/RestoreObject', {'ID': id.toString()});
    }

    public async getVerjaardagen(): Promise<HeliosLedenDataset[]> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        const response: Response = await this.apiService.get('Leden/GetVerjaardagen');
        return response.json();
    }

    async syncSynapse(id: number, password: string | undefined = undefined)
    {
        const body = { 'ID': id, 'PASSWORD': password};
        this.apiService.post('Leden/SynapseGebruiker', JSON.stringify(body))
    }
}
