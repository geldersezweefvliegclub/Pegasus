import {Injectable} from '@angular/core';
import {
    HeliosCompetenties,
    HeliosCompetentiesDataset,
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
    private fallbackTimer: number;                           // Timer om te zorgen dat data geladen echt is

    private competentiesStore = new BehaviorSubject(this.competentiesCache.dataset);
    public readonly competentiesChange = this.competentiesStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {

        // We hebben misschien eerder de comptenties opgehaald. Die gebruiken we totdat de API data heeft opgehaald
        if (this.storageService.ophalen('competenties') != null) {
            this.competentiesCache = this.storageService.ophalen('competenties');
            this.competentiesStore.next(this.competentiesCache.dataset!)    // afvuren event met opgeslagen vliegtuigen dataset
        }

        // Deze timer kijkt periodiek of de data er is. API call bij inloggen kan mislukt zijn dus dit is de fallback
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
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.competentiesCache?.dataset as HeliosCompetentiesDataset[];
    }
}
