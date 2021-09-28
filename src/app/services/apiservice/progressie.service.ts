import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {StorageService} from "../storage/storage.service";
import {
    HeliosBehaaldeProgressie,
    HeliosProgressieBoom,
    HeliosBehaaldeProgressieDataset,
    HeliosProgressie, HeliosProgressieKaartDataset, HeliosProgressieKaart, HeliosAanwezigLedenDataset
} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";

@Injectable({
    providedIn: 'root'
})
export class ProgressieService {
    private progressie: HeliosBehaaldeProgressie = { dataset: []};
    private boom: HeliosProgressieBoom[] = [];
    private kaart:HeliosProgressieKaart = { dataset: []};

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {
    }

    async getProgressie(lidID:number, comptentiesIDs?: string): Promise<HeliosBehaaldeProgressieDataset[]> {
        let progressie: HeliosBehaaldeProgressie | null = null;
        let hash: string = '';

        let getParams: KeyValueArray = {};
        getParams['LID_ID'] = lidID.toString();

        if (comptentiesIDs) {
            getParams['IN'] = comptentiesIDs;
        }

        try {
            const response = await this.apiService.get('Progressie/GetObjects', getParams);
            this.progressie = await response.json();
        } catch (e) {
            throw(e);
        }
        return this.progressie?.dataset as [];
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
        let getParams: KeyValueArray = {};
        getParams['LID_ID'] = lidID.toString();

        const response:Response = await this.apiService.get('Progressie/ProgressieBoom', getParams);
        this.boom = await response.json();

        return this.boom as HeliosProgressieBoom[];
    }

    async getProgressieKaart(lidID:number):Promise<HeliosProgressieKaartDataset[]> {
        let getParams: KeyValueArray = {};
        getParams['LID_ID'] = lidID.toString();

        const response: Response = await this.apiService.get('Progressie/ProgressieKaart', getParams);
        this.kaart = await response.json();

        return this.kaart?.dataset as HeliosProgressieKaartDataset[];
    }
}
