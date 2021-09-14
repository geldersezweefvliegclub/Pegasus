import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {HeliosType, HeliosTypes} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';

@Injectable({
    providedIn: 'root'
})
export class TypesService {

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {
    }

    async getTypes(groep: number): Promise<HeliosType[]> {
        let types: HeliosTypes | null = null;
        let hash: string = '';

        if (this.storageService.ophalen('types-' + groep) != null) {
            types = this.storageService.ophalen('types-' + groep);
        }

        let getParams: KeyValueArray = {};

        getParams['GROEP'] = groep.toString();

        if (types != null) { // we hebben eerder de lijst opgehaald
            hash = hash as string;
//      getParams['HASH'] = hash;
        }

        try {
            const response = await this.apiService.get('Types/GetObjects', getParams);

            types = await response.json();
            this.storageService.opslaan('types-' + groep, types);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return types?.dataset as [];
    }
}
