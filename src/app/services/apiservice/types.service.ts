import { Injectable } from '@angular/core';
import { APIService } from './api.service';
import { HeliosType, HeliosTypes } from '../../types/Helios';
import { StorageService } from '../storage/storage.service';
import { KeyValueArray } from '../../types/Utils';
import { BehaviorSubject } from 'rxjs';
import { LoginService } from './login.service';

@Injectable({
    providedIn: 'root'
})
export class TypesService {
    private typesCache: HeliosTypes = { dataset: []};        // return waarde van API call
    private cvTypesCache: HeliosTypes = { dataset: []};      // clubvliegtuigen type
    private fallbackTimer: number;                           // Timer om te zorgen dat starts geladen echt is

    private typesStore = new BehaviorSubject(this.typesCache.dataset);
    public readonly typesChange = this.typesStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {

        // We hebben misschien eerder de lidTypes opgehaald. Die gebruiken we totdat de API starts heeft opgehaald
        if (this.storageService.ophalen('types') != null) {
            this.typesCache = this.storageService.ophalen('types') as HeliosTypes;
            if (this.typesCache) {
                this.typesStore.next(this.typesCache.dataset!)    // afvuren event met opgeslagen type dataset
            }
        }

        // Deze timer kijkt periodiek of de starts er is. API call bij inloggen kan mislukt zijn dus dit is de fallback
        this.fallbackTimer = window.setInterval(() => {
            if (this.loginService.isIngelogd()) {
                let ophalen = false;
                if (this.typesCache === undefined) {
                    ophalen = true
                } else if (this.typesCache.dataset!.length < 1) {
                    ophalen = true;
                }
                if (ophalen) {
                    this.getTypes().then(() => {
                        this.typesStore.next(this.typesCache.dataset!)    // afvuren event
                    });
                }
            }
        }, 1000 * 60);  // iedere minuut

        // nadat we ingelogd zijn kunnen we de lidTypes ophalen
        loginService.inloggenSucces.subscribe(() => {
            this.getTypes().then(() => {
                this.typesStore.next(this.typesCache.dataset!)    // afvuren event
            });
        })

    }

    async getTypes(verwijderd = false): Promise<HeliosType[]> {
        const getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.typesCache != undefined)  && (this.typesCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.typesCache.hash;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response = await this.apiService.get('Types/GetObjects', getParams);
            this.typesCache = await response.json();
            this.storageService.opslaan('types', this.typesCache);
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.typesCache?.dataset as HeliosType[];
    }

    async getClubVliegtuigTypes(): Promise<HeliosType[]> {
        const getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.cvTypesCache != undefined) && (this.cvTypesCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.cvTypesCache.hash;
        }

        try {
            const response = await this.apiService.get('Types/GetClubVliegtuigenTypes', getParams);
            this.cvTypesCache = await response.json();
            this.storageService.opslaan('cvTypes', this.cvTypesCache);
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.cvTypesCache?.dataset as HeliosType[];
    }

    async getType(id: number): Promise<HeliosType> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }
        const response: Response = await this.apiService.get('Types/GetObject', {'ID': id.toString()});
        return response.json();
    }

    async addType(t: HeliosType) {
        const response: Response = await this.apiService.post('Types/SaveObject', JSON.stringify(t));
        return response.json();
    }

    async updateType(t: HeliosType) {
        const response: Response = await this.apiService.put('Types/SaveObject', JSON.stringify(t));
        return response.json();
    }

    async deleteType(id: number) {
        await this.apiService.delete('Types/DeleteObject', {'ID': id.toString()});
    }

    async restoreType(id: number) {
        await this.apiService.patch('Types/RestoreObject', {'ID': id.toString()});
    }
}
