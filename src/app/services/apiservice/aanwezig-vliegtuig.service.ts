import {Injectable} from '@angular/core';
import {StorageService} from '../storage/storage.service';
import {DateTime} from 'luxon';
import {KeyValueArray} from '../../types/Utils';
import {APIService} from './api.service';
import {HeliosAanwezigVliegtuigen, HeliosAanwezigVliegtuigenDataset} from '../../types/Helios';


@Injectable({
    providedIn: 'root'
})
export class AanwezigVliegtuigService {
    private aanwezig: HeliosAanwezigVliegtuigen = { dataset: []};

    constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {
    }

    async getAanwezig(startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosAanwezigVliegtuigenDataset[]> {
        let hash: string = '';

        if (((this.aanwezig == null)) && (this.storageService.ophalen('aanwezigVliegtuigen') != null)) {
            this.aanwezig = this.storageService.ophalen('aanwezigVliegtuigen');
        }

        let getParams: KeyValueArray = params;

        if (this.aanwezig != null) { // we hebben eerder de lijst opgehaald
            hash = this.aanwezig.hash as string;
//      getParams['HASH'] = hash;
        }

        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }


        try {
            const response: Response = await this.APIService.get('AanwezigVliegtuigen/GetObjects', getParams);

            this.aanwezig = await response.json();
            this.storageService.opslaan('aanwezigVliegtuigen', this.aanwezig);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.aanwezig?.dataset as HeliosAanwezigVliegtuigenDataset[];
    }
}
