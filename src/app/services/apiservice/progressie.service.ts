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
    private vorigVerzoekProgressie: string = '';        // parameters van vorige call

    private boom: HeliosProgressieBoom[] = [];
    private vorigVerzoekBoom: string = '';              // parameters van vorige call

    private kaart:HeliosProgressieKaart = { dataset: []};
    private vorigVerzoekKaart: string = '';              // parameters van vorige call

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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekProgressie) {
            return this.progressie?.dataset as HeliosAanwezigLedenDataset[];
        }
        else
        {
            this.vorigVerzoekProgressie = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekProgressie = '', 5000);     // over 5 seconden mogen we weer API aanroepen
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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekBoom) {
            return this.boom as HeliosProgressieBoom[];
        }
        else
        {
            this.vorigVerzoekBoom = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekBoom = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        const response:Response = await this.apiService.get('Progressie/ProgressieBoom', getParams);
        this.boom = await response.json();

        return this.boom as HeliosProgressieBoom[];
    }

    async getProgressieKaart(lidID:number):Promise<HeliosProgressieKaartDataset[]> {
        let getParams: KeyValueArray = {};
        getParams['LID_ID'] = lidID.toString();

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekKaart) {
            return this.kaart.dataset as HeliosProgressieKaartDataset[];
        }
        else
        {
            this.vorigVerzoekKaart = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekKaart = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        const response: Response = await this.apiService.get('Progressie/ProgressieKaart', getParams);
        this.kaart = await response.json();

        return this.kaart?.dataset as HeliosProgressieKaartDataset[];
    }
}
