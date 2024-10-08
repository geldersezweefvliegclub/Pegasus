import { Injectable } from '@angular/core';
import { APIService } from './api.service';

import {
  HeliosLogboek,
  HeliosLogboekDataset,
  HeliosLogboekTotalen,
  HeliosRecency,
  HeliosStart,
  HeliosStartDataset,
  HeliosStarts,
  HeliosVliegdagen,
  HeliosVliegtuigLogboek,
  HeliosVliegtuigLogboekDataset,
  HeliosVliegtuigLogboekTotalen,
} from '../../types/Helios';
import { StorageService } from '../storage/storage.service';
import { KeyValueArray } from '../../types/Utils';
import { DateTime } from 'luxon';
import { LoginService } from './login.service';
import { CustomJsonSerializer } from '../../utils/Utils';

type parameters = Record<string, string>;

@Injectable({
    providedIn: 'root'
})
export class StartlijstService {
    private startsCache: HeliosStarts = { dataset: []};                      // return waarde van API call
    private vliegdagenCache: HeliosVliegdagen = { dataset: []};              // return waarde van API call
    private logboekCache: HeliosLogboek = { dataset: []};                    // return waarde van API call logboek vlieger
    private vliegtuigLogboekCache: HeliosVliegtuigLogboek = { dataset: []};  // return waarde van API call

    private logboekTotalen: HeliosLogboekTotalen | null = null;         // totalen logboek voor vlieger
    private vliegtuigLogboekTotalen: HeliosVliegtuigLogboekTotalen;

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {
    }

    async getVliegdagen(startDatum: DateTime, eindDatum: DateTime): Promise<[]> {
        const getParams: parameters = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        // starttoren heeft geen vliegdagen nodig
        if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
            return [];
        }

        try {
            const response: Response = await this.apiService.get('Startlijst/GetVliegDagen',
                getParams
            );

            this.vliegdagenCache = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) { // er is geen starts
                throw(e);
            }
        }
        return this.vliegdagenCache?.dataset as [];
    }

    async getLogboek(id: number, startDatum: DateTime, eindDatum: DateTime, maxRecords?: number): Promise<HeliosLogboekDataset[]> {
        const getParams: parameters = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        // starttoren heeft geen logboek nodig
        if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
            return [];
        }

        if ((this.logboekCache != undefined)  && (this.logboekCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.logboekCache.hash;
        }

        getParams['LID_ID'] = id.toString();
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;

        if (maxRecords) {
            getParams['MAX'] = maxRecords.toString();
        }

        try {
            const response: Response = await this.apiService.get('Startlijst/GetLogboek', getParams);
            this.logboekCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)  && (e.responseCode !== 404)) { // er is geen starts, of starts is ongewijzigd
                throw(e);
            }
        }
        return this.logboekCache?.dataset as HeliosLogboekDataset[];
    }

    async getLogboekTotalen(id: number, jaar:number): Promise<HeliosLogboekTotalen> {
        type parameters = Record<string, string>;

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }

        // starttoren heeft geen logboek totalen nodig
        if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
            return {};
        }

        const getParams: parameters = {};
        getParams['LID_ID'] = id.toString();
        getParams['JAAR'] = jaar.toString();

        const response: Response = await this.apiService.get('Startlijst/GetLogboekTotalen', getParams);

        this.logboekTotalen = await response.json();
        return this.logboekTotalen as HeliosLogboekTotalen;
    }

    async getVliegtuigLogboek(id: number, startDatum: DateTime, eindDatum: DateTime, limit?: number): Promise<HeliosVliegtuigLogboekDataset[]> {
        const getParams: parameters = {};
        getParams['ID'] = id.toString();
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;

        if (limit) {
            getParams['START'] = "0"
            getParams['MAX'] = limit.toString();
        }

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        try {
            const response: Response = await this.apiService.get('Startlijst/GetVliegtuigLogboek',
                getParams
            );

            this.vliegtuigLogboekCache = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) { // er is geen starts
                throw(e);
            }
        }
        return this.vliegtuigLogboekCache?.dataset as [];
    }

    async getVliegtuigLogboekTotalen(id: number, jaar:number): Promise<HeliosVliegtuigLogboekTotalen> {
        const getParams: parameters = {};
        getParams['ID'] = id.toString();
        getParams['JAAR'] = jaar.toString();

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }


        const response: Response = await this.apiService.get('Startlijst/GetVliegtuigLogboekTotalen',
            getParams
        );

        this.vliegtuigLogboekTotalen = await response.json();
        return this.vliegtuigLogboekTotalen;
    }

    async getStarts(verwijderd = false, startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise< HeliosStartDataset[]> {
        const getParams: KeyValueArray = params;

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.startsCache != undefined)  && (this.startsCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.startsCache.hash;
        }

        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.apiService.get('Startlijst/GetObjects', getParams );
            this.startsCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.startsCache?.dataset as [];
    }

    async getStartDetails(id: number): Promise< HeliosStartDataset | undefined> {
        const getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return;
        }

        getParams['ID'] = id;

        try {
            const response: Response = await this.apiService.get('Startlijst/GetObjects', getParams );
            const obj = await response.json();
            return obj.dataset[0];
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw (e);
            }
        }
    }

    async getStart(id: number): Promise<HeliosStart> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }
        const response: Response = await this.apiService.get('Startlijst/GetObject', {'ID': id.toString()});
        return response.json();
    }

    async getRecency(lidID: number, datum?: DateTime): Promise<HeliosRecency> {
        const getParams: KeyValueArray = {};
        getParams['VLIEGER_ID'] = lidID.toString();

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }

        // starttoren heeft geen recency nodig
        if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
            return {};
        }

        if (datum) {
            getParams['DATUM'] = datum.toISODate() as string;
        }

        const response: Response = await this.apiService.get('Startlijst/GetRecency', getParams);
        return response.json();
    }

    async addStart(start: HeliosStart) {
        const response: Response = await this.apiService.post('Startlijst/SaveObject', JSON.stringify(start));
        return response.json();
    }

    async updateStart(start: HeliosStart) {
        const response: Response = await this.apiService.put('Startlijst/SaveObject', JSON.stringify(start, CustomJsonSerializer));

        return response.json();
    }

    async deleteStart(id: number) {
        await this.apiService.delete('Startlijst/DeleteObject', {'ID': id.toString()});
    }

    async restoreStart(id: number) {
        await this.apiService.patch('Startlijst/RestoreObject', {'ID': id.toString()});
    }

    async startTijd(id: number, tijd: string) {
        const response: Response = await this.apiService.put('Startlijst/SaveObject', JSON.stringify({ID: id,STARTTIJD: (tijd) ? tijd : null }));

        return response.json();
    }

    async landingsTijd(id: number, tijd: string) {
        const response: Response = await this.apiService.put('Startlijst/SaveObject', JSON.stringify({ID: id,LANDINGSTIJD: (tijd) ? tijd : null }));

        return response.json();
    }
}
