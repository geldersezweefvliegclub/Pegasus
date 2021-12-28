import {Injectable} from '@angular/core';
import {APIService} from './api.service';

import {HeliosLeden, HeliosLedenDataset, HeliosLid} from '../../types/Helios';
import {KeyValueArray} from '../../types/Utils';
import {BehaviorSubject, Subscription} from "rxjs";
import {SharedService} from "../shared/shared.service";
import {LoginService} from "./login.service";

@Injectable({
    providedIn: 'root'
})
export class LedenService {
    private ledenCache: HeliosLeden  = { dataset: []};       // return waarde van API call

    private overslaan: boolean = false;
    private ophaalTimer: number;                                // Iedere 15 min halen we de leden op
    private fallbackTimer: number;                              // Timer om te zorgen dat data geladen echt is
    private ledenStore = new BehaviorSubject(this.ledenCache.dataset);
    private dbEventAbonnement: Subscription;
    public readonly ledenChange = this.ledenStore.asObservable();      // nieuwe leden beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {

        // nadat we ingelogd zijn kunnen we de vliegtuigen ophalen
        loginService.inloggenSucces.subscribe(() => {
            this.ophalenLeden().then((dataset) => {
                this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
            });
        });

        this.ophaalTimer = window.setInterval(() => {
            this.ophalenLeden().then((dataset) => {
                this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
            });
        }, 1000 * 60 * 15);

        // Deze timer kijkt periodiek of de data er is. API call bij inloggen kan mislukt zijn dus dit is de fallback
        this.fallbackTimer = window.setInterval(() => {
            if (this.loginService.isIngelogd()) {
                let ophalen = false;
                if (this.ledenCache === undefined) {
                    ophalen = true
                } else if (this.ledenCache.dataset!.length < 1) {
                    ophalen = true;
                }
                if (ophalen) {
                    this.ophalenLeden().then((dataset) => {
                        this.ledenStore.next(this.ledenCache.dataset)    // afvuren event
                    });
                }
            }
        }, 1000 * 60);  // iedere minuut

        // Als leden zijn aangepast, dan moeten we overzicht opnieuw ophalen
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
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
        let getParams: KeyValueArray = {};

        if ((this.ledenCache != undefined)  && (this.ledenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.ledenCache.hash;
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
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde data als cache
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
        const replacer = (key:string, value:any) =>
            typeof value === 'undefined' ? null : value;

        const response: Response = await this.apiService.put('Leden/SaveObject', JSON.stringify(lid, replacer));
        return response.json();
    }

    async deleteLid(id: number) {
        await this.apiService.delete('Leden/DeleteObject', {'ID': id.toString()});
    }

    async restoreLid(id: number) {
        await this.apiService.patch('Leden/RestoreObject', {'ID': id.toString()});
    }
}
