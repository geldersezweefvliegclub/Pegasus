import {Injectable} from '@angular/core';
import {APIService} from './api.service';

import {HeliosType, HeliosVliegtuig, HeliosVliegtuigen, HeliosVliegtuigenDataset} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';
import {BehaviorSubject} from "rxjs";
import {SharedService} from "../shared/shared.service";

@Injectable({
    providedIn: 'root'
})
export class VliegtuigenService {
    private vliegtuigenCache: HeliosVliegtuigen = {dataset: []};     // return waarde van API call

    private ophaalTimer: number;                                // Iedere 15 min halen we de leden op
    private vliegtuigenStore = new BehaviorSubject(this.vliegtuigenCache.dataset);
    public readonly vliegtuigenChange = this.vliegtuigenStore.asObservable();      // nieuwe vliegtuigen beschikbaar

    constructor(private readonly APIService: APIService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService) {

        this.getVliegtuigen().then((dataset) => {
            this.vliegtuigenStore.next(this.vliegtuigenCache.dataset)    // afvuren event
        });

        this.ophaalTimer = window.setInterval(() => {
            this.getVliegtuigen().then((dataset) => {
                this.vliegtuigenStore.next(this.vliegtuigenCache.dataset)    // afvuren event
            });
        }, 1000 * 60 * 15);

        // Als leden zijn aangepast, dan moeten we overzicht opnieuw ophalen
        this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Vliegtuigen") {
                this.getVliegtuigen().then((dataset) => {
                    this.vliegtuigenStore.next(this.vliegtuigenCache.dataset)    // afvuren event
                });
            }
        });
    }

    async getVliegtuigen(verwijderd: boolean = false, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosVliegtuigenDataset[]> {
        let hash: string = '';

        if (((this.vliegtuigenCache == null)) && (this.storageService.ophalen('vliegtuigen') != null)) {
            this.vliegtuigenCache = this.storageService.ophalen('vliegtuigen');
        }

        let getParams: KeyValueArray = params;

        if (this.vliegtuigenCache != null) { // we hebben eerder de lijst opgehaald
            hash = this.vliegtuigenCache.hash as string;
//            getParams['HASH'] = hash;
        }

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.APIService.get('Vliegtuigen/GetObjects', getParams);

            this.vliegtuigenCache = await response.json();
            this.storageService.opslaan('vliegtuigen', this.vliegtuigenCache);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.vliegtuigenCache?.dataset as HeliosVliegtuigenDataset[];
    }

    async getVliegtuig(id: number): Promise<HeliosVliegtuig> {
        const response: Response = await this.APIService.get('Vliegtuigen/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async addVliegtuig(vliegtuig: HeliosVliegtuig) {
        const response: Response = await this.APIService.post('Vliegtuigen/SaveObject', JSON.stringify(vliegtuig));
        return response.json();
    }

    async updateVliegtuig(vliegtuig: HeliosVliegtuig) {
        const response: Response = await this.APIService.put('Vliegtuigen/SaveObject', JSON.stringify(vliegtuig));

        return response.json();
    }

    async deleteVliegtuig(id: number) {
        try {
            await this.APIService.delete('Vliegtuigen/DeleteObject', {'ID': id.toString()});
        } catch (e) {
            throw(e);

        }
    }

    async restoreVliegtuig(id: number) {
        try {
            await this.APIService.patch('Vliegtuigen/RestoreObject', {'ID': id.toString()});
        } catch (e) {
            throw(e);

        }
    }
}
