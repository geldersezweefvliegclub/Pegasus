import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {StorageService} from "../storage/storage.service";
import {
    HeliosBehaaldeProgressie,
    HeliosBehaaldeProgressieDataset,
    HeliosProgressie,
    HeliosProgressieBoom,
    HeliosProgressieKaart,
    HeliosProgressieKaartDataset
} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {LoginService} from "./login.service";

@Injectable({
    providedIn: 'root'
})
export class ProgressieService {
    private progressieCache: HeliosBehaaldeProgressie = { dataset: []};  // return waarde van API call
    private kaartCache:HeliosProgressieKaart = { dataset: []};           // return waarde van API call

    private boom: HeliosProgressieBoom[] = [];

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {
    }

    async getProgressie(lidID:number, comptentiesIDs?: string): Promise<HeliosBehaaldeProgressieDataset[]> {
        let progressie: HeliosBehaaldeProgressie | null = null;

        let getParams: KeyValueArray = {};
        getParams['LID_ID'] = lidID.toString();

        if ((this.progressieCache != undefined)  && (this.progressieCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.progressieCache.hash;
        }
        if (comptentiesIDs) {
            getParams['IN'] = comptentiesIDs;
        }

        try {
            const response = await this.apiService.get('Progressie/GetObjects', getParams);
            this.progressieCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) {  // er is geen nieuwe data
                throw(e);
            }
        }
        return this.progressieCache?.dataset as [];
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

        // starttoren heeft geen progressie nodig
        if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
            return [];
        }

        const response:Response = await this.apiService.get('Progressie/ProgressieBoom', getParams);
        this.boom = await response.json();

        return this.boom as HeliosProgressieBoom[];
    }

    async getProgressieKaart(lidID:number):Promise<HeliosProgressieKaartDataset[]> {
        let getParams: KeyValueArray = {};
        getParams['LID_ID'] = lidID.toString();

        // starttoren heeft geen progressie nodig
        if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
            return [];
        }

        const response: Response = await this.apiService.get('Progressie/ProgressieKaart', getParams);
        this.kaartCache = await response.json();

        return this.kaartCache?.dataset as HeliosProgressieKaartDataset[];
    }
}
