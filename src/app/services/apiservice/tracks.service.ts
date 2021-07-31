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

    async getLaatsteTracks(verwijderd: boolean = false, zoekString?: string): Promise<HeliosTracksDataset[]> {
        let hash: string = '';

        if (((this.tracks == null)) && (this.storageService.ophalen('leden') != null)) {
            this.tracks = this.storageService.ophalen('laatste-tracks-page');
        }

        let getParams: KeyValueArray = {};

        if (this.tracks != null) { // we hebben eerder de lijst opgehaald
            hash = this.tracks.hash as string;
            getParams['HASH'] = hash;
        }
        getParams['MAX'] = '50';
        getParams['SORT'] = 'INGEVOERD DESC';

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.apiService.get('Tracks/GetObjects', getParams);

            this.tracks = await response.json();
            this.storageService.opslaan('leden', this.tracks);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }

        // we laten een lid maar 1 keer voorkomen in het resulaat van de functie.
        let retValue: HeliosTracksDataset[] = [];
        this.tracks?.dataset?.forEach(item => {
            if (retValue.findIndex(trk => trk.LID_ID == item.LID_ID) < 0) {
                retValue.push(item);    // dit lid toevoegen, is niet eerder opgenomen
            }
        });
        return retValue;
    }

    async getVliegerTracks(lidID:number): Promise<HeliosTracksDataset[]> {
        let getParams: KeyValueArray = {};

        getParams['LID_ID'] = lidID.toString();
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
