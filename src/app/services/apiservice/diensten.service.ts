import {Injectable} from '@angular/core';
import {
    HeliosDienst,
    HeliosDiensten,
    HeliosDienstenDataset, HeliosDienstenTotaal,
    HeliosTrack,
    HeliosTracks,
    HeliosTracksDataset
} from "../../types/Helios";
import {APIService} from "./api.service";
import {LoginService} from "./login.service";
import {StorageService} from "../storage/storage.service";
import {CustomError, KeyValueArray} from "../../types/Utils";
import {DateTime} from "luxon";

@Injectable({
    providedIn: 'root'
})


export class DienstenService {
    diensten: HeliosDiensten | null = null;

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {
    }

    async getDiensten(startDatum: DateTime, eindDatum: DateTime, dienstType?: number, lidID?: number): Promise<HeliosDienstenDataset[]> {
        let getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (lidID) {
            getParams['LID_ID'] = lidID.toString();
        }
        if (dienstType) {
            getParams['TYPES'] = dienstType.toString();
        }

        try {
            const response: Response = await this.apiService.get('Diensten/GetObjects', getParams);

            this.diensten = await response.json();
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.diensten?.dataset as HeliosTracksDataset[];
    }


    async getTotalen(jaar: number, lidID?: number): Promise<HeliosDienstenTotaal[]> {
        let getParams: KeyValueArray = {};
        getParams['JAAR'] = jaar.toString();

        if (lidID) {
            getParams['LID_ID'] = lidID.toString();
        }

        try {
            const response: Response = await this.apiService.get('Diensten/TotaalDiensten', getParams);

            return await response.json();
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return [];
    }

    async addDienst(dienst: HeliosDienst) {
        const response: Response = await this.apiService.post('Diensten/SaveObject', JSON.stringify(dienst));
        return response.json();
    }

    async updateDienst(dienst: HeliosDienst) {
        dienst.ROOSTER_ID = undefined;
        dienst.INGEVOERD_DOOR_ID = undefined;
        const response: Response = await this.apiService.put('Diensten/SaveObject', JSON.stringify(dienst));

        return response.json();
    }

    async deleteDienst(id: number) {
        await this.apiService.delete('Diensten/DeleteObject', {'ID': id.toString()});
    }

    async restoreDienst(id: number) {
        await this.apiService.patch('Diensten/RestoreObject', {'ID': id.toString()});
    }
}
