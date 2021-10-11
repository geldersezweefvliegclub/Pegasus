import {Injectable} from '@angular/core';
import {APIService} from './api.service';

import {HeliosAanwezigLedenDataset, HeliosLeden, HeliosLedenDataset, HeliosLid} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';
import {BehaviorSubject} from "rxjs";
import {DateTime} from "luxon";
import {getBeginEindDatumVanMaand} from "../../utils/Utils";
import {SharedService} from "../shared/shared.service";

@Injectable({
    providedIn: 'root'
})
export class LedenService {
    private refreshTimer: number;
    private ledenCache: HeliosLeden  = { dataset: []};       // return waarde van API call

    private overslaan: boolean = false;
    private ophaalTimer: number;                                // Iedere 15 min halen we de leden op
    private ledenStore = new BehaviorSubject(this.ledenCache.dataset);
    public readonly ledenChange = this.ledenStore.asObservable();      // nieuwe leden beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService) {

        this.ophalenLeden().then((dataset) => {
            this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
        });

        this.ophaalTimer = window.setInterval(() => {
            this.ophalenLeden().then((dataset) => {
                this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
            });
        }, 1000 * 60 * 15);

        // Als leden zijn aangepast, dan moeten we overzicht opnieuw ophalen
        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Leden") {
                this.ophalenLeden().then((dataset) => {
                    this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
                });
            }
        });
    }

    private async ophalenLeden(): Promise<HeliosLedenDataset[]> {
        if (this.overslaan) {
            return this.ledenCache?.dataset as HeliosLedenDataset[];
        }
        this.overslaan = true;
        setTimeout(() => this.overslaan = false, 1000 * 5)
        return await this.getLeden();
    }

    async getLeden(verwijderd: boolean = false, zoekString?: string): Promise<HeliosLedenDataset[]> {
        let hash: string = '';

        if (((this.ledenCache == null)) && (this.storageService.ophalen('leden') != null)) {
            this.ledenCache = this.storageService.ophalen('leden');
        }

        let getParams: KeyValueArray = {};

        if (this.ledenCache != null) { // we hebben eerder de lijst opgehaald
            hash = this.ledenCache.hash as string;
//            getParams['HASH'] = hash;
        }

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.apiService.get('Leden/GetObjects', getParams);

            this.ledenCache = await response.json();
            this.storageService.opslaan('leden', this.ledenCache);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.ledenCache?.dataset as HeliosLedenDataset[];
    }

    async getLid(id: number): Promise<HeliosLid> {
        const response: Response = await this.apiService.get('Leden/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async addLid(lid: HeliosLid) {
        const response: Response = await this.apiService.post('Leden/SaveObject', JSON.stringify(lid));
        return response.json();
    }

    async updateLid(lid: HeliosLid) {
        const response: Response = await this.apiService.put('Leden/SaveObject', JSON.stringify(lid));

        return response.json();
    }

    async deleteLid(id: number) {
        await this.apiService.delete('Leden/DeleteObject', {'ID': id.toString()});
    }

    async restoreLid(id: number) {
        await this.apiService.patch('Leden/RestoreObject', {'ID': id.toString()});
    }
}
