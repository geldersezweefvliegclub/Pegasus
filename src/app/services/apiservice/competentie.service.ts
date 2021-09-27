import {Injectable} from '@angular/core';
import {
    HeliosAanwezigLeden,
    HeliosAanwezigLedenDataset,
    HeliosCompetenties,
    HeliosCompetentiesDataset,
    HeliosType,
    HeliosTypes
} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {APIService} from "./api.service";
import {StorageService} from "../storage/storage.service";

@Injectable({
    providedIn: 'root'
})
export class CompetentieService {

    private competenties: HeliosCompetenties = { dataset: []};
    private vorigVerzoek: string = '';       // parameters van vorige call

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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoek) {
            return this.competenties?.dataset as HeliosCompetentiesDataset[];
        }
        else
        {
            this.vorigVerzoek = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoek = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response = await this.apiService.get('Competenties/GetObjects', getParams);

            this.competenties = await response.json();
            this.storageService.opslaan('competenties', competenties);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.competenties?.dataset as HeliosCompetentiesDataset[];
    }
}
