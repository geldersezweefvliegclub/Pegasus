import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {
    HeliosJournaal,
    HeliosJournaals,
    HeliosJournaalDataset
} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {DateTime} from "luxon";

export interface journaalFilter {
    alleenVliegtuigen: boolean;
    alleenRollend: boolean;

    selectedRollend: number[];
    selectedCategorie: number[];
    selectedStatus: number[];
    selectedVliegtuigen: number[];
}

@Injectable({
    providedIn: 'root'
})
export class JournaalService {
    private meldingenCache: HeliosJournaals = {dataset: []};      // return waarde van API call

    constructor(private readonly apiService: APIService) {
    }

    async getJournaals(filter: journaalFilter, startDatum: DateTime, eindDatum: DateTime, zoekString?: string, verwijderd = false): Promise<HeliosJournaalDataset[]> {
        const getParams: KeyValueArray = {};

        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;

        if ((this.meldingenCache != undefined) && (this.meldingenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.meldingenCache.hash;
        }

        if (filter.selectedVliegtuigen.length > 0) {
            getParams['VLIEGTUIG_ID']  = filter.selectedVliegtuigen.join(',');
        }

        if (filter.selectedRollend.length > 0) {
            getParams['ROLLEND_ID']  = filter.selectedRollend.join(',');
        }

        if (filter.selectedStatus.length > 0) {
            getParams['STATUS_ID']  = filter.selectedStatus.join(',');
        }

        if (filter.selectedCategorie.length > 0) {
            getParams['CATEGORIE_ID']  = filter.selectedCategorie.join(',');
        }

        if (filter.alleenVliegtuigen) {
            getParams['VLIEGEND']  = true;
        }

        if (filter.alleenRollend) {
            getParams['ROLLEND']  = true;
        }

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.apiService.get('Journaal/GetObjects', getParams);
            this.meldingenCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw (e);
            }
        }
        return this.meldingenCache?.dataset as HeliosJournaalDataset[];
    }

    async getJournaal(id: number): Promise<HeliosJournaal> {
        const response: Response = await this.apiService.get('Journaal/GetObject', {'ID': id.toString()});
        return response.json();
    }

    async addJournaal(melding: HeliosJournaal) {
        const response: Response = await this.apiService.post('Journaal/SaveObject', JSON.stringify(melding));
        return response.json();
    }

    async updateJournaal(melding: HeliosJournaal) {
        const response: Response = await this.apiService.put('Journaal/SaveObject', JSON.stringify(melding));

        return response.json();
    }

    async deleteJournaal(id: number) {
        await this.apiService.delete('Journaal/DeleteObject', {'ID': id.toString()});
    }

    async restoreJournaal(id: number) {
        await this.apiService.patch('Journaal/RestoreObject', {'ID': id.toString()});
    }
}
