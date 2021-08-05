import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {HeliosTrack, HeliosTracks, HeliosTracksDataset} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {StorageService} from "../storage/storage.service";

@Injectable({
    providedIn: 'root'
})
export class TracksService {
    tracks: HeliosTracks | null = null;

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {}


    async getTracks(lidID?:number, max?: number): Promise<HeliosTracksDataset[]> {
        let getParams: KeyValueArray = {};

        if (lidID) {
            getParams['LID_ID'] = lidID.toString();
        }
        if ((max) && (max > 0)) {
            getParams['MAX'] = max.toString();
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
        const response: Response = await this.apiService.get('Tracks/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async nieuwTrack(lid: HeliosTrack) {
        const response: Response = await this.apiService.post('Tracks/SaveObject', JSON.stringify(lid));
        return response.json();
    }

    async updateTrack(lid: HeliosTrack) {
        const response: Response = await this.apiService.put('Tracks/SaveObject', JSON.stringify(lid));

        return response.json();
    }

    async deleteTrack(id: number) {
        await this.apiService.delete('Tracks/DeleteObject', {'ID': id.toString()});
    }

    async restoreTrack(id: number) {
        await this.apiService.patch('Tracks/RestoreObject', {'ID': id.toString()});
    }
}
