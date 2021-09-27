import {Injectable} from '@angular/core';
import {APIService} from './api.service';

import {HeliosType, HeliosVliegtuig, HeliosVliegtuigen, HeliosVliegtuigenDataset} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';

@Injectable({
    providedIn: 'root'
})
export class VliegtuigenService {
    private vliegtuigen: HeliosVliegtuigen = {dataset: []};
    private vorigVerzoek: string = '';                            // parameters van vorige call

    constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {

    }

    async getVliegtuigen(verwijderd: boolean = false, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosVliegtuigenDataset[]> {
        let hash: string = '';

        if (((this.vliegtuigen == null)) && (this.storageService.ophalen('vliegtuigen') != null)) {
            this.vliegtuigen = this.storageService.ophalen('vliegtuigen');
        }

        let getParams: KeyValueArray = params;

        if (this.vliegtuigen != null) { // we hebben eerder de lijst opgehaald
            hash = this.vliegtuigen.hash as string;
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
            return this.vliegtuigen?.dataset as HeliosVliegtuigenDataset[];
        } else {
            this.vorigVerzoek = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoek = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response: Response = await this.APIService.get('Vliegtuigen/GetObjects', getParams);

            this.vliegtuigen = await response.json();
            this.storageService.opslaan('vliegtuigen', this.vliegtuigen);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.vliegtuigen?.dataset as HeliosVliegtuigenDataset[];
    }

    async getVliegtuig(id: number): Promise<HeliosVliegtuig> {
        const response: Response = await this.APIService.get('Vliegtuigen/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async addVliegtuig(vliegtuig: HeliosVliegtuig) {
        const response: Response = await this.APIService.post('Vliegtuigen/SaveObject', JSON.stringify(vliegtuig));
        return response.json();
    }

    async updateVliegtuig(vliegtuig: HeliosVliegtuig) {
        const response: Response = await this.APIService.put('Vliegtuigen/SaveObject', JSON.stringify(vliegtuig));

        return response.json();
    }

    async deleteVliegtuig(id: number) {
        try {
            await this.APIService.delete('Vliegtuigen/DeleteObject', {'ID': id.toString()});
        } catch (e) {
            throw(e);

        }
    }

    async restoreVliegtuig(id: number) {
        try {
            await this.APIService.patch('Vliegtuigen/RestoreObject', {'ID': id.toString()});
        } catch (e) {
            throw(e);

        }
    }
}
