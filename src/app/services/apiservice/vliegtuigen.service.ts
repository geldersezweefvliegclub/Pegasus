import { Injectable } from '@angular/core';
import { APIService } from './api.service';

import { HeliosVliegtuig, HeliosVliegtuigen, HeliosVliegtuigenDataset } from '../../types/Helios';
import { StorageService } from '../storage/storage.service';
import { KeyValueArray } from '../../types/Utils';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SharedService } from '../shared/shared.service';
import { LoginService } from './login.service';
import { CustomJsonSerializer } from '../../utils/Utils';

@Injectable({
    providedIn: 'root'
})
export class VliegtuigenService {
    private vliegtuigenCache: HeliosVliegtuigen = {dataset: []};     // return waarde van API call

    private overslaan = false;
    private ophaalTimer: number;                                // Iedere 15 min halen we de leden op
    private fallbackTimer: number;                              // Timer om te zorgen dat starts geladen echt is
    private vliegtuigenStore = new BehaviorSubject(this.vliegtuigenCache.dataset);
    private dbEventAbonnement: Subscription;
    public readonly vliegtuigenChange = this.vliegtuigenStore.asObservable();      // nieuwe vliegtuigen beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService) {

        // We hebben misschien eerder de vliegtuigen opgehaald. Die gebruiken we totdat de API starts heeft opgehaald
        if (this.storageService.ophalen('vliegtuigen') != null) {
            this.vliegtuigenCache = this.storageService.ophalen('vliegtuigen') as HeliosVliegtuigen;
            this.vliegtuigenStore.next(this.vliegtuigenCache.dataset!)    // afvuren event met opgeslagen vliegtuigen dataset
        }

        // nadat we ingelogd zijn kunnen we de vliegtuigen ophalen
        loginService.inloggenSucces.subscribe(() => {
            this.ophalenVliegtuigen().then(() => {
                this.vliegtuigenStore.next(this.vliegtuigenCache.dataset)    // afvuren event
            });
        });

        // Deze timer kijkt periodiek of de starts er is. API call bij inloggen kan mislukt zijn dus dit is de fallback
        this.fallbackTimer = window.setInterval(() => {
            if (this.loginService.isIngelogd()) {
                let ophalen = false;
                if (this.vliegtuigenCache === undefined) {
                    ophalen = true
                } else if (this.vliegtuigenCache.dataset!.length < 1) {
                    ophalen = true;
                }
                if (ophalen) {
                    this.ophalenVliegtuigen().then(() => {
                        this.vliegtuigenStore.next(this.vliegtuigenCache.dataset)    // afvuren event
                    });
                }
            }
        }, 1000 * 60);  // iedere minuut

        this.ophaalTimer = window.setInterval(() => {
            this.ophalenVliegtuigen().then(() => {
                this.vliegtuigenStore.next(this.vliegtuigenCache.dataset)    // afvuren event
            });
        }, 1000 * 60 * 15);

        // Als vliegtuigen zijn aangepast, dan moeten we overzicht opnieuw ophalen
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Vliegtuigen") {
                this.ophalenVliegtuigen().then(() => {
                    this.vliegtuigenStore.next(this.vliegtuigenCache.dataset)    // afvuren event
                });
            }
        });
    }

    private async ophalenVliegtuigen(): Promise<HeliosVliegtuigenDataset[]> {
        if (this.overslaan) {
            return this.vliegtuigenCache?.dataset as HeliosVliegtuigenDataset[];
        }
        this.overslaan = true;
        setTimeout(() => this.overslaan = false, 1000 * 5)
        return await this.getVliegtuigen();
    }

    async getVliegtuigen(verwijderd = false, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosVliegtuigenDataset[]> {
        const getParams: KeyValueArray = params;

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.vliegtuigenCache != undefined)  && (this.vliegtuigenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.vliegtuigenCache.hash
        }
        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.apiService.get('Vliegtuigen/GetObjects', getParams);
            this.vliegtuigenCache = await response.json();
            this.storageService.opslaan('vliegtuigen', this.vliegtuigenCache);
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.vliegtuigenCache?.dataset as HeliosVliegtuigenDataset[];
    }

    async getVliegtuig(id: number): Promise<HeliosVliegtuig> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }
        const response: Response = await this.apiService.get('Vliegtuigen/GetObject', {'ID': id.toString()});
        return response.json();
    }

    async addVliegtuig(vliegtuig: HeliosVliegtuig) {
        const response: Response = await this.apiService.post('Vliegtuigen/SaveObject', JSON.stringify(vliegtuig));
        return response.json();
    }

    async updateVliegtuig(vliegtuig: HeliosVliegtuig) {
        const response: Response = await this.apiService.put('Vliegtuigen/SaveObject', JSON.stringify(vliegtuig, CustomJsonSerializer));
        return response.json();
    }

    async deleteVliegtuig(id: number) {
        await this.apiService.delete('Vliegtuigen/DeleteObject', {'ID': id.toString()});
    }

    async restoreVliegtuig(id: number) {
        await this.apiService.patch('Vliegtuigen/RestoreObject', {'ID': id.toString()});
    }
}
