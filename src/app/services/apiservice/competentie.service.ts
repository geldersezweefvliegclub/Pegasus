import {Injectable} from '@angular/core';
import {
    HeliosCompetenties,
    HeliosCompetentiesDataset,
} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {APIService} from "./api.service";
import {StorageService} from "../storage/storage.service";
import {BehaviorSubject} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class CompetentieService {
    private competentiesCache: HeliosCompetenties = { dataset: []};  // return waarde van API call

    private competentiesStore = new BehaviorSubject(this.competentiesCache.dataset);
    public readonly competentiesChange = this.competentiesStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {

        // We hebben misschien eerder de comptenties opgehaald. Die gebruiken we totdat de API data heeft opgehaald
        if (this.storageService.ophalen('competenties') != null) {
            this.competentiesCache = this.storageService.ophalen('competenties');
            this.competentiesStore.next(this.competentiesCache.dataset!)    // afvuren event met opgeslagen vliegtuigen dataset
        }

        // We gaan nu de API aanroepen om data op te halen
        this.getCompetenties().then((dataset) => {
            this.competentiesStore.next(this.competentiesCache.dataset!)    // afvuren event
        });
    }

    async getCompetenties(): Promise<HeliosCompetentiesDataset[]> {
        let competenties: HeliosCompetenties | null = null;
        let hash: string = '';
        let getParams: KeyValueArray = {};

        if (this.competentiesCache != null) { // we hebben eerder de lijst opgehaald
            hash = hash as string;
            getParams['HASH'] = hash;
        }

        try {
            const response = await this.apiService.get('Competenties/GetObjects', getParams);

            this.competentiesCache = await response.json();
            this.storageService.opslaan('competenties', competenties);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.competentiesCache?.dataset as HeliosCompetentiesDataset[];
    }
}
