import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {StorageService} from "../storage/storage.service";
import {
    HeliosLid,
    HeliosBehaaldeProgressie,
    HeliosProgressieBoom,
    HeliosBehaaldeProgressieDataset,
    HeliosProgressie, HeliosProgressieKaartDataset, HeliosProgressieKaart
} from "../../types/Helios";
import {KeyValueString} from "../../types/Utils";

@Injectable({
    providedIn: 'root'
})
export class ProgressieService {

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {
    }

    async getProgressie(lidID:number, comptentiesIDs?: string): Promise<HeliosBehaaldeProgressieDataset[]> {
        let progressie: HeliosBehaaldeProgressie | null = null;
        let hash: string = '';

        let getParams: KeyValueString = {};
        getParams['LID_ID'] = lidID.toString();

        if (comptentiesIDs) {
            getParams['IN'] = comptentiesIDs;
        }

        try {
            const response = await this.apiService.get('Progressie/GetObjects', getParams);

            progressie = await response.json();
        } catch (e) {
            throw(e);
        }
        return progressie?.dataset as [];
    }

    async behaaldeCompetentie(progressie: HeliosProgressie):Promise<HeliosProgressie> {
        const response: Response = await this.apiService.post('Progressie/SaveObject', JSON.stringify(progressie));
        return response.json();
    }

    async verwijderCompetentie(id: number) {
        try {
            await this.apiService.delete('Progressie/DeleteObject', {'ID': id.toString()});
        } catch (e) {
            throw(e);
        }
    }


    async getBoom(lidID:number): Promise<HeliosProgressieBoom[]> {
        let boom: HeliosProgressieBoom | null = null;

        let getParams: KeyValueString = {};
        getParams['LID_ID'] = lidID.toString();

        const response:Response = await this.apiService.get('Progressie/ProgressieBoom', getParams);
        boom = await response.json();

        return boom as HeliosProgressieBoom[];
    }

    async getProgressieKaart(lidID:number):Promise<HeliosProgressieKaartDataset[]> {
        let kaart:HeliosProgressieKaart | null = null;

        let getParams: KeyValueString = {};
        getParams['LID_ID'] = lidID.toString();

        const response: Response = await this.apiService.get('Progressie/ProgressieKaart', getParams);
        kaart = await response.json();

        return kaart?.dataset as [];
    }
}
