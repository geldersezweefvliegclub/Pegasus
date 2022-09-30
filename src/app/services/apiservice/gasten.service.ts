import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {HeliosGasten, HeliosGastenDataset, HeliosTrack, HeliosGast} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {LoginService} from "./login.service";
import {DateTime} from "luxon";

@Injectable({
    providedIn: 'root'
})
export class GastenService {
    private gastenCache: HeliosGasten = {dataset: []};      // return waarde van API call

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService) {
    }

    async getGasten(verwijderd: boolean = false, startDatum: DateTime, eindDatum: DateTime): Promise<HeliosGastenDataset[]> {
        let getParams: KeyValueArray = {};

        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();
        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.apiService.get('Gasten/GetObjects', getParams);
            this.gastenCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.gastenCache?.dataset as HeliosGastenDataset[];
    }

    async getGast(id: number): Promise<HeliosGast> {
        const response: Response = await this.apiService.get('Gasten/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async addGast(gast: HeliosGast) {
        const response: Response = await this.apiService.post('Gasten/SaveObject', JSON.stringify(gast));
        return response.json();
    }

    async updateGast(gast: HeliosGast) {
        const response: Response = await this.apiService.put('Gasten/SaveObject', JSON.stringify(gast));
        return response.json();
    }

    async deleteGast(id: number) {
        await this.apiService.delete('Gasten/DeleteObject', {'ID': id.toString()});
    }

    async restoreGast(id: number) {
        await this.apiService.patch('Gasten/RestoreObject', {'ID': id.toString()});
    }
}
