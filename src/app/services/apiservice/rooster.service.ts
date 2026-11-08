import { Injectable, inject } from '@angular/core';
import { DateTime } from 'luxon';
import { APIService } from './api.service';
import { KeyValueArray } from '../../types/Utils';
import { HeliosRooster, HeliosRoosterDag, HeliosRoosterDataset } from '../../types/Helios';
import { CustomJsonSerializer } from '../../utils/Utils';
import { LoginService } from './login.service';

@Injectable({
    providedIn: 'root'
})
export class RoosterService {
    private readonly apiService = inject(APIService);
    private readonly loginService = inject(LoginService);

    private roosterCache = new Map<string, HeliosRooster>();                        // return waarde van API call, per maand (yyyy-MM)
    private lopendeVerzoeken = new Map<string, Promise<HeliosRoosterDataset[]>>();  // verzoeken die nog onderweg zijn, per maand

    // Het rooster wordt altijd per maand opgehaald. Voor een kortere periode (week, dag) filteren we uit de maand(en).
    async getRooster(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosRoosterDataset[]> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        // een periode kan over meerdere maanden lopen, bijv. een week aan het eind van de maand
        const maanden: DateTime[] = [];
        for (let maand = startDatum.startOf('month'); maand <= eindDatum; maand = maand.plus({months: 1})) {
            maanden.push(maand);
        }
        const perMaand = await Promise.all(maanden.map((maand) => this.getMaand(maand)));

        // nieuwe array, zodat aanroepers de cache niet kunnen aanpassen
        const begin = startDatum.toISODate() as string;
        const eind = eindDatum.toISODate() as string;
        return perMaand.flat().filter((dag) => dag.DATUM !== undefined && dag.DATUM >= begin && dag.DATUM <= eind);
    }

    async updateRoosterdag(roosterDag: HeliosRoosterDag) {
        const response: Response = await this.apiService.put('Rooster/SaveObject', JSON.stringify(roosterDag, CustomJsonSerializer));

        return response.json();
    }

    // als dezelfde maand al opgevraagd wordt, wachten we op dat verzoek in plaats van een nieuw verzoek te sturen
    private getMaand(maand: DateTime): Promise<HeliosRoosterDataset[]> {
        const sleutel = maand.toFormat('yyyy-MM');
        let verzoek = this.lopendeVerzoeken.get(sleutel);
        if (!verzoek) {
            verzoek = this.ophalenMaand(sleutel, maand).finally(() => this.lopendeVerzoeken.delete(sleutel));
            this.lopendeVerzoeken.set(sleutel, verzoek);
        }
        return verzoek;
    }

    private async ophalenMaand(sleutel: string, maand: DateTime): Promise<HeliosRoosterDataset[]> {
        const getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = maand.startOf('month').toISODate() as string;
        getParams['EIND_DATUM'] = maand.endOf('month').toISODate() as string;

        // de hash hoort bij een specifieke maand
        const cache = this.roosterCache.get(sleutel);
        if (cache?.hash != undefined) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = cache.hash;
        }

        try {
            const response: Response = await this.apiService.get('Rooster/GetObjects', getParams);
            const resultaat: HeliosRooster = await response.json();
            this.roosterCache.set(sleutel, resultaat);
            return (resultaat.dataset ?? []) as HeliosRoosterDataset[];
        } catch (e) {
            if (e.responseCode === 404) { // er is geen rooster voor deze maand
                this.roosterCache.delete(sleutel);
                return [];
            }

            if ((e.responseCode !== 304) && (e.responseCode !== 704)) {  // er is geen nieuw rooster
                throw(e);
            }
        }
        return (cache?.dataset ?? []) as HeliosRoosterDataset[];
    }
}
