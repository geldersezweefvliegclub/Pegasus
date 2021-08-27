import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {HeliosTrack, HeliosTracks, HeliosTracksDataset} from "../../types/Helios";
import {CustomError, KeyValueArray} from "../../types/Utils";
import {StorageService} from "../storage/storage.service";
import {LoginService} from "./login.service";
import {error} from "protractor";

@Injectable({
    providedIn: 'root'
})
export class TracksService {
    tracks: HeliosTracks | null = null;

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {}


    async getTracks(verwijderd: boolean = false, lidID?:number, max?: number): Promise<HeliosTracksDataset[]> {


        // Alleen als we onderstaande rollen nie hebben, gaan we ook geen data proberen op te halen
        const ui = this.loginService.userInfo?.Userinfo;
        if (!ui?.isCIMT && !ui?.isInstructeur && !ui?.isBeheerder) {
            const error: CustomError = {beschrijving: "Niet gemachtigd om tracks te laden"};
            throw error;
        }

        let getParams: KeyValueArray = {};

        if (lidID) {
            getParams['LID_ID'] = lidID.toString();
        }
        if ((max) && (max > 0)) {
            getParams['MAX'] = max.toString();
        }
        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }
        getParams['SORT'] = 'INGEVOERD DESC';

        try {
            const response: Response = await this.apiService.get('Tracks/GetObjects', getParams);

            this.tracks = await response.json();
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.tracks?.dataset as HeliosTracksDataset[];
    }

    async getTrack(id: number): Promise<HeliosTrack> {

        // Alleen als we onderstaande rollen nie hebben, gaan we ook geen data proberen op te halen
        const ui = this.loginService.userInfo?.Userinfo;
        if (!ui?.isCIMT && !ui?.isInstructeur && !ui?.isBeheerder) {
            const error: CustomError = {beschrijving: "Niet gemachtigd om tracks te laden"};
            throw error;
        }

        const response: Response = await this.apiService.get('Tracks/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async addTrack(trk: HeliosTrack) {
        const response: Response = await this.apiService.post('Tracks/SaveObject', JSON.stringify(trk));
        return response.json();
    }

    async updateTrack(trk: HeliosTrack) {
        trk.LINK_ID = undefined;
        trk.INGEVOERD = undefined;
        const response: Response = await this.apiService.put('Tracks/SaveObject', JSON.stringify(trk));

        return response.json();
    }

    async deleteTrack(id: number) {
        await this.apiService.delete('Tracks/DeleteObject', {'ID': id.toString()});
    }

    async restoreTrack(id: number) {
        await this.apiService.patch('Tracks/RestoreObject', {'ID': id.toString()});
    }
}
