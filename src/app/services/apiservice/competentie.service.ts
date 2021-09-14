import {Injectable} from '@angular/core';
import {HeliosCompetenties, HeliosCompetentiesDataset, HeliosType, HeliosTypes} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {APIService} from "./api.service";
import {StorageService} from "../storage/storage.service";

@Injectable({
    providedIn: 'root'
})
export class CompetentieService {

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {
    }

    async getCompetenties(): Promise<HeliosCompetentiesDataset[]> {
        let competenties: HeliosCompetenties | null = null;
        let hash: string = '';

        if (this.storageService.ophalen('competenties') != null) {
            competenties = this.storageService.ophalen('competenties');
        }

        let getParams: KeyValueArray = {};

        if (competenties != null) { // we hebben eerder de lijst opgehaald
            hash = hash as string;
//      getParams['HASH'] = hash;
        }

        try {
            const response = await this.apiService.get('Competenties/GetObjects', getParams);

            competenties = await response.json();
            this.storageService.opslaan('competenties', competenties);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return competenties?.dataset as [];
    }
}
