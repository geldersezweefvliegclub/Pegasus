import {Injectable} from '@angular/core';
import {APIService} from './api.service';

import {HeliosAanwezigLedenDataset, HeliosLeden, HeliosLedenDataset, HeliosLid} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';

@Injectable({
    providedIn: 'root'
})
export class LedenService {
    private leden: HeliosLeden  = { dataset: []};
    private vorigVerzoek: string = '';       // parameters van vorige call

    constructor(private readonly apiService: APIService, private readonly storageService: StorageService) {

    }

    async getLeden(verwijderd: boolean = false, zoekString?: string): Promise<HeliosLedenDataset[]> {
        let hash: string = '';

        if (((this.leden == null)) && (this.storageService.ophalen('leden') != null)) {
            this.leden = this.storageService.ophalen('leden');
        }

        let getParams: KeyValueArray = {};

        if (this.leden != null) { // we hebben eerder de lijst opgehaald
            hash = this.leden.hash as string;
//            getParams['HASH'] = hash;
        }

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoek) {
            return this.leden?.dataset as HeliosAanwezigLedenDataset[];
        }
        else
        {
            this.vorigVerzoek = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoek = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response: Response = await this.apiService.get('Leden/GetObjects', getParams);

            this.leden = await response.json();
            this.storageService.opslaan('leden', this.leden);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.leden?.dataset as HeliosLedenDataset[];
    }

    async getLid(id: number): Promise<HeliosLid> {
        const response: Response = await this.apiService.get('Leden/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async addLid(lid: HeliosLid) {
        const response: Response = await this.apiService.post('Leden/SaveObject', JSON.stringify(lid));
        return response.json();
    }

    async updateLid(lid: HeliosLid) {
        const response: Response = await this.apiService.put('Leden/SaveObject', JSON.stringify(lid));

        return response.json();
    }

    async deleteLid(id: number) {
        await this.apiService.delete('Leden/DeleteObject', {'ID': id.toString()});
    }

    async restoreLid(id: number) {
        await this.apiService.patch('Leden/RestoreObject', {'ID': id.toString()});
    }
}
