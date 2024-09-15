import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {HeliosTrack, HeliosTracks, HeliosTracksDataset} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {LoginService} from "./login.service";

@Injectable({
    providedIn: 'root'
})
export class TracksService {
    private tracksCache: HeliosTracks = {dataset: []};      // return waarde van API call

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService) {}

    async getTracks(verwijderd = false, lidID?: number, max?: number): Promise<HeliosTracksDataset[]> {

        // Alleen als we onderstaande rollen nie hebben, gaan we ook geen starts proberen op te halen
        const ui = this.loginService.userInfo?.Userinfo;
        if (!ui?.isCIMT && !ui?.isInstructeur && !ui?.isBeheerder) {
            throw {beschrijving: "Niet gemachtigd om tracks te laden"};
        }

        const getParams: KeyValueArray = {};

        if ((this.tracksCache != undefined) && (this.tracksCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.tracksCache.hash;
        }
        if (lidID && lidID >= 0) {
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
            this.tracksCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw (e);
            }
        }
        return this.tracksCache?.dataset as HeliosTracksDataset[];
    }

    async getTrack(id: number): Promise<HeliosTrack> {

        // Alleen als we onderstaande rollen nie hebben, gaan we ook geen starts proberen op te halen
        const ui = this.loginService.userInfo?.Userinfo;
        if (!ui?.isCIMT && !ui?.isInstructeur && !ui?.isBeheerder) {
            throw {beschrijving: "Niet gemachtigd om tracks te laden"};
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
