import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {StorageService} from "../storage/storage.service";
import {HeliosProgressieDataset} from "../../types/Helios";
import {KeyValueString} from "../../types/Utils";

@Injectable({
    providedIn: 'root'
})
export class ProgressieService {

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {
    }

    async getProgressie(lidID:number, comptentiesIDs?: string): Promise<HeliosProgressieDataset[]> {
        let progressie: HeliosProgressieDataset | null = null;
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
}
