import {Injectable} from '@angular/core';
import {
    HeliosCompetentie,
    HeliosCompetenties,
    HeliosCompetentiesDataset,
    HeliosProgressieBoom,
    HeliosType,
} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {APIService} from "./api.service";
import {StorageService} from "../storage/storage.service";
import {BehaviorSubject} from "rxjs";
import {LoginService} from "./login.service";

@Injectable({
    providedIn: 'root'
})
export class CompetentieService {
    private competentiesCache: HeliosCompetenties = {dataset: []};  // return waarde van API call
    private fallbackTimer: number;                           // Timer om te zorgen dat starts geladen echt is

    private competentiesStore = new BehaviorSubject(this.competentiesCache.dataset);
    public readonly competentiesChange = this.competentiesStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    private boom: HeliosProgressieBoom[] = [];

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {

        // We hebben misschien eerder de comptenties opgehaald. Die gebruiken we totdat de API starts heeft opgehaald
        if (this.storageService.ophalen('competenties') != null) {
            this.competentiesCache = this.storageService.ophalen('competenties');
            this.competentiesStore.next(this.competentiesCache.dataset!)    // afvuren event met opgeslagen vliegtuigen dataset
        }

        // Deze timer kijkt periodiek of de competenties er is. API call bij inloggen kan mislukt zijn dus dit is de fallback
        this.fallbackTimer = window.setInterval(() => {
            if (this.loginService.isIngelogd()) {
                let ophalen = false;
                if (this.competentiesCache === undefined) {
                    ophalen = true
                } else if (this.competentiesCache.dataset!.length < 1) {
                    ophalen = true;
                }
                if (ophalen) {
                    this.getCompetenties().then((dataset) => {
                        this.competentiesStore.next(this.competentiesCache.dataset!)    // afvuren event
                    });
                }
            }
        }, 1000 * 60);  // iedere minuut

        // nadat we ingelogd zijn kunnen we de comptenties ophalen
        loginService.inloggenSucces.subscribe(() => {
            this.getCompetenties().then((dataset) => {
                this.competentiesStore.next(this.competentiesCache.dataset!)    // afvuren event
            });
        });
    }

    async getCompetenties(): Promise<HeliosCompetentiesDataset[]> {
        let competenties: HeliosCompetenties | null = null;
        let getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        // starttoren heeft geen competenties nodig
        if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
            return [];
        }

        if ((this.competentiesCache != undefined) && (this.competentiesCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.competentiesCache.hash;
        }

        try {
            const response = await this.apiService.get('Competenties/GetObjects', getParams);

            this.competentiesCache = await response.json();
            this.storageService.opslaan('competenties', this.competentiesCache);
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.competentiesCache?.dataset as HeliosCompetentiesDataset[];
    }

    async getBoom(): Promise<HeliosProgressieBoom[]> {
        let getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        // starttoren heeft geen comptenties nodig
        if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
            return [];
        }

        const response: Response = await this.apiService.get('Competenties/CompetentiesBoom', getParams);
        this.boom = await response.json();

        return this.boom as HeliosProgressieBoom[];
    }

    async getCompetentie(id: number): Promise<HeliosType> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }
        const response: Response = await this.apiService.get('Competenties/GetObject', {'ID': id.toString()});
        return response.json();
    }

    async addCompetentie(competentie: HeliosCompetentie) {
        const replacer = (key: string, value: any) =>
            typeof value === 'undefined' ? null : value;

        const response: Response = await this.apiService.post('Competenties/SaveObject', JSON.stringify(competentie));
        return response.json();
    }

    async updateCompetentie(competentie: HeliosCompetentie) {
        const replacer = (key: string, value: any) =>
            typeof value === 'undefined' ? null : value;

        const response: Response = await this.apiService.put('Competenties/SaveObject', JSON.stringify(competentie));
        return response.json();
    }

    async deleteCompetentie(id: number) {
        await this.apiService.delete('Competenties/DeleteObject', {'ID': id.toString()});
    }

    async restoreCompetentie(id: number) {
        await this.apiService.patch('Competenties/RestoreObject', {'ID': id.toString()});
    }
}
