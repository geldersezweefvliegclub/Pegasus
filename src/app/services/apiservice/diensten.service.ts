import {Injectable} from '@angular/core';
import {
    HeliosAanwezigLedenDataset,
    HeliosDienst,
    HeliosDiensten,
    HeliosDienstenDataset, HeliosDienstenTotaal,
    HeliosTracksDataset
} from "../../types/Helios";
import {APIService} from "./api.service";
import {StorageService} from "../storage/storage.service";
import {KeyValueArray} from "../../types/Utils";
import {DateTime} from "luxon";

@Injectable({
    providedIn: 'root'
})


export class DienstenService {
    private diensten: HeliosDiensten = { dataset: []};
    private vorigVerzoekDiensten: string = '';       // parameters van vorige call

    private totalen: HeliosDienstenTotaal[] = [];
    private vorigVerzoekTotalen: string = '';        // parameters van vorige call

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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekDiensten) {
            return this.diensten?.dataset as HeliosAanwezigLedenDataset[];
        }
        else
        {
            this.vorigVerzoekDiensten = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekDiensten = '', 5000);     // over 5 seconden mogen we weer API aanroepen
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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekTotalen) {
            return this.totalen;
        }
        else
        {
            this.vorigVerzoekTotalen = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekTotalen = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response: Response = await this.apiService.get('Diensten/TotaalDiensten', getParams);

            this.totalen = await response.json();
            return this.totalen;

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
