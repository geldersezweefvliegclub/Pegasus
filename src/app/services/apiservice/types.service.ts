import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {HeliosAanwezigLedenDataset, HeliosTracks, HeliosType, HeliosTypes} from '../../types/Helios';
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

        this.getTypes().then((dataset) => {
            this.typesStore.next(this.typesCache.dataset!)    // afvuren event
        });
    }

    async getTypes(): Promise<HeliosType[]> {
        let hash: string = '';

        if (this.storageService.ophalen('types') != null) {
            this.typesCache = this.storageService.ophalen('types');
        }

        let getParams: KeyValueArray = {};

        if (this.typesCache != null) { // we hebben eerder de lijst opgehaald
            hash = hash as string;
//      getParams['HASH'] = hash;
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
