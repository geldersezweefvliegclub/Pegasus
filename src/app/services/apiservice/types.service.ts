import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {HeliosAanwezigLedenDataset, HeliosTracks, HeliosType, HeliosTypes} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';

@Injectable({
    providedIn: 'root'
})
export class TypesService {
    private types: HeliosTypes = { dataset: []};
    private vorigVerzoek: string = '';                            // parameters van vorige call

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {
    }

    async getTypes(groep: number): Promise<HeliosType[]> {
        let hash: string = '';

        if (this.storageService.ophalen('types-' + groep) != null) {
            this.types = this.storageService.ophalen('types-' + groep);
        }

        let getParams: KeyValueArray = {};

        getParams['GROEP'] = groep.toString();

        if (this.types != null) { // we hebben eerder de lijst opgehaald
            hash = hash as string;
//      getParams['HASH'] = hash;
        }

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoek) {
            return this.types?.dataset as HeliosType[];
        }
        else
        {
            this.vorigVerzoek = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoek = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response = await this.apiService.get('Types/GetObjects', getParams);

            this.types = await response.json();
            this.storageService.opslaan('types-' + groep, this.types);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.types?.dataset as HeliosType[];
    }
}
