import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {HeliosType, HeliosTypes} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';
import {BehaviorSubject} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class TypesService {
    private typesCache: HeliosTypes = { dataset: []};        // return waarde van API call

    private typesStore = new BehaviorSubject(this.typesCache.dataset);
    public readonly typesChange = this.typesStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {

        // We hebben misschien eerder de types opgehaald. Die gebruiken we totdat de API data heeft opgehaald
        if (this.storageService.ophalen('types') != null) {
            this.typesCache = this.storageService.ophalen('types');
            this.typesStore.next(this.typesCache.dataset!)    // afvuren event met opgeslagen type dataset
        }

        // We gaan nu de API aanroepen om data op te halen
        this.getTypes().then((dataset) => {
            this.typesStore.next(this.typesCache.dataset!)    // afvuren event
        });
    }

    async getTypes(): Promise<HeliosType[]> {
        let hash: string = '';
        let getParams: KeyValueArray = {};

        if (this.typesCache != null) { // we hebben eerder de lijst opgehaald
            hash = hash as string;
            getParams['HASH'] = hash;
        }

        try {
            const response = await this.apiService.get('Types/GetObjects', getParams);
            this.typesCache = await response.json();
            this.storageService.opslaan('types', this.typesCache);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.typesCache?.dataset as HeliosType[];
    }
}
