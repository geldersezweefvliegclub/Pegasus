import {Injectable} from '@angular/core';
import {StorageService} from '../storage/storage.service';
import {DateTime} from 'luxon';
import {KeyValueArray} from '../../types/Utils';
import {APIService} from './api.service';
import {HeliosAanwezigLeden, HeliosAanwezigLedenDataset, HeliosAanwezigVliegtuigenDataset} from '../../types/Helios';


@Injectable({
    providedIn: 'root'
})
export class AanwezigLedenService {
    private aanwezig: HeliosAanwezigLeden = { dataset: []};
    private vorigVerzoek: string = '';       // parameters van vorige call

    constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {
    }

    async getAanwezig(startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosAanwezigLedenDataset[]> {
        let hash: string = '';

        if (((this.aanwezig == null)) && (this.storageService.ophalen('aanwezigLeden') != null)) {
            this.aanwezig = this.storageService.ophalen('aanwezigLeden');
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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoek) {
            return this.aanwezig?.dataset as HeliosAanwezigLedenDataset[];
        }
        else
        {
            this.vorigVerzoek = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoek = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response: Response = await this.APIService.get('AanwezigLeden/GetObjects', getParams);

            this.aanwezig = await response.json();
            this.storageService.opslaan('aanwezigLeden', this.aanwezig);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.aanwezig?.dataset as HeliosAanwezigLedenDataset[];
    }
}
