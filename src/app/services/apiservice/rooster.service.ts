import {Injectable} from '@angular/core';
import {DateTime} from 'luxon';
import {APIService} from './api.service';
import {KeyValueArray} from '../../types/Utils';
import {
    HeliosAanwezigLeden,
    HeliosProgressieKaartDataset,
    HeliosRooster,
    HeliosRoosterDag,
    HeliosRoosterDataset
} from '../../types/Helios';

@Injectable({
    providedIn: 'root'
})
export class RoosterService {
    private rooster: HeliosRooster = { dataset: []};
    private vorigVerzoek: string = '';       // parameters van vorige call

    constructor(private readonly APIService: APIService) {
    }

    async getRooster(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosRoosterDataset[]> {
        let getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoek) {
            return this.rooster!.dataset as HeliosProgressieKaartDataset[];
        }
        else
        {
            this.vorigVerzoek = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoek = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response: Response = await this.APIService.get('Rooster/GetObjects', getParams);
            this.rooster = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) { // er is geen data
                throw(e);
            }
            return [];
        }
        return this.rooster!.dataset as HeliosRoosterDataset[];
    }

    async addRoosterdag(roosterDag: HeliosRoosterDag) {
        const response: Response = await this.APIService.post('Rooster/SaveObject', JSON.stringify(roosterDag));
        return response.json();
    }

    async updateRoosterdag(roosterDag: HeliosRoosterDag) {
        const response: Response = await this.APIService.put('Rooster/SaveObject', JSON.stringify(roosterDag));

        return response.json();
    }
}
