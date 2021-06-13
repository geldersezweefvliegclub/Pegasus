import {Injectable} from '@angular/core';
import {APIService} from './api.service';

import {HeliosVliegtuig, HeliosVliegtuigen} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueString} from '../../types/Utils';

@Injectable({
    providedIn: 'root'
})
export class VliegtuigenService {
    vliegtuigen: HeliosVliegtuigen | null = null;

    constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {

    }

    async getVliegtuigen(verwijderd: boolean = false, zoekString?: string): Promise<[]> {
        let hash: string = '';

        if (((this.vliegtuigen == null)) && (this.storageService.ophalen('vliegtuigen') != null)) {
            this.vliegtuigen = this.storageService.ophalen('vliegtuigen');
        }

        let getParams: KeyValueString = {};

        if (this.vliegtuigen != null) { // we hebben eerder de lijst opgehaald
            hash = this.vliegtuigen.hash as string;
            getParams['HASH'] = hash;
        }

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
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
        return this.vliegtuigen?.dataset as [];
    }

    async getVliegtuig(id: number): Promise<HeliosVliegtuig> {
        const response: Response = await this.APIService.get('Vliegtuigen/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async nieuwVliegtuig(vliegtuig: HeliosVliegtuig) {
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
