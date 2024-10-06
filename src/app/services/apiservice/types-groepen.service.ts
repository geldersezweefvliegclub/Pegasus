import { Injectable } from '@angular/core';
import { HeliosTypesGroep, HeliosTypesGroepen } from '../../types/Helios';
import { BehaviorSubject } from 'rxjs';
import { APIService } from './api.service';
import { LoginService } from './login.service';
import { StorageService } from '../storage/storage.service';
import { KeyValueArray } from '../../types/Utils';

@Injectable({
    providedIn: 'root'
})

export class TypesGroepenService {
    private typesGroepenCache: HeliosTypesGroepen = {dataset: []};        // return waarde van API call

    private typesGroepenStore = new BehaviorSubject(this.typesGroepenCache.dataset);
    public readonly typesGroepenChange = this.typesGroepenStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {

        // We hebben misschien eerder de lidTypes opgehaald. Die gebruiken we totdat de API starts heeft opgehaald
        if (this.storageService.ophalen('types') != null) {
            this.typesGroepenCache = this.storageService.ophalen('typesGroepen') as HeliosTypesGroepen;
            if (this.typesGroepenCache) {
                this.typesGroepenStore.next(this.typesGroepenCache.dataset!)    // afvuren event met opgeslagen type dataset
            }
        }
    }

    async getTypesGroepen(): Promise<HeliosTypesGroep[]> {
        const getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.typesGroepenCache != undefined) && (this.typesGroepenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.typesGroepenCache.hash;
        }

        try {
            const response = await this.apiService.get('TypesGroepen/GetObjects', getParams);
            this.typesGroepenCache = await response.json();
            this.storageService.opslaan('typesGroepen', this.typesGroepenCache);
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.typesGroepenCache?.dataset as HeliosTypesGroep[];
    }
}
