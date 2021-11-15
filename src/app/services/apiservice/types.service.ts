import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {HeliosType, HeliosTypes} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';
import {BehaviorSubject} from "rxjs";
import {LoginService} from "./login.service";

@Injectable({
    providedIn: 'root'
})
export class TypesService {
    private typesCache: HeliosTypes = { dataset: []};        // return waarde van API call
    private fallbackTimer: number;                           // Timer om te zorgen dat data geladen echt is

    private typesStore = new BehaviorSubject(this.typesCache.dataset);
    public readonly typesChange = this.typesStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {

        // We hebben misschien eerder de lidTypes opgehaald. Die gebruiken we totdat de API data heeft opgehaald
        if (this.storageService.ophalen('types') != null) {
            this.typesCache = this.storageService.ophalen('types');
            this.typesStore.next(this.typesCache.dataset!)    // afvuren event met opgeslagen type dataset
        }

        // Deze timer kijkt periodiek of de data er is. API call bij inloggen kan mislukt zijn dus dit is de fallback
        this.fallbackTimer = window.setInterval(() => {
            if (this.loginService.isIngelogd()) {
                let ophalen = false;
                if (this.typesCache === undefined) {
                    ophalen = true
                } else if (this.typesCache.dataset!.length < 1) {
                    ophalen = true;
                }
                if (ophalen) {
                    this.getTypes().then((dataset) => {
                        this.typesStore.next(this.typesCache.dataset!)    // afvuren event
                    });
                }
            }
        }, 1000 * 60);  // iedere minuut

        // nadat we ingelogd zijn kunnen we de lidTypes ophalen
        loginService.inloggenSucces.subscribe(() => {
            this.getTypes().then((dataset) => {
                this.typesStore.next(this.typesCache.dataset!)    // afvuren event
            });
        })

    }

    async getTypes(): Promise<HeliosType[]> {
        let getParams: KeyValueArray = {};

        if ((this.typesCache != undefined)  && (this.typesCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.typesCache.hash;
        }

        try {
            const response = await this.apiService.get('Types/GetObjects', getParams);
            this.typesCache = await response.json();
            this.storageService.opslaan('types', this.typesCache);
        } catch (e) {
            if (e.responseCode !== 704) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.typesCache?.dataset as HeliosType[];
    }
}
