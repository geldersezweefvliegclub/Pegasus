import { Injectable } from '@angular/core';
import { APIService } from './api.service';
import { LoginService } from './login.service';
import {
  HeliosTransactie,
  HeliosTransacties,
  HeliosTransactiesBanken,
  HeliosTransactiesDataset,
} from '../../types/Helios';
import { KeyValueArray } from '../../types/Utils';
import { DateTime } from 'luxon';

@Injectable({
    providedIn: 'root'
})
export class TransactiesService {
    private transactiesCache: HeliosTransacties = { dataset: []};      // return waarde van API call


    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService) {
    }

    async getTransacties(lidID?: number, startDatum?: DateTime, eindDatum?: DateTime, vliegdag?: DateTime, max?: number): Promise<HeliosTransactiesDataset[]> {
        const getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.transactiesCache != undefined) && (this.transactiesCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.transactiesCache.hash;
        }
        if (lidID && lidID >= 0) {
            getParams['LID_ID'] = lidID.toString();
        }
        if (startDatum) {
            getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        }
        if (eindDatum) {
            getParams['EIND_DATUM'] = eindDatum.toISODate() as string;
        }
        if (vliegdag) {
            getParams['VLIEGDAG'] = vliegdag.toISODate() as string;
        }

        if ((max) && (max > 0)) {
            getParams['MAX'] = max.toString();
        }
        getParams['SORT'] = 'DATUM DESC';

        try {
            const response: Response = await this.apiService.get('Transacties/GetObjects', getParams);
            this.transactiesCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.transactiesCache?.dataset as HeliosTransactiesDataset[];
    }

    async getBanken(): Promise<HeliosTransactiesBanken[]> {
        let banken:HeliosTransactiesBanken[] = [];

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        try {
            const response: Response = await this.apiService.get('Transacties/GetBanken');
            banken = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return banken;
    }

    async StartIDealTransactie(lidID: number, bestellingID: number, bankID: string, url: string): Promise<string> {
        const response: Response = await this.apiService.post('Transacties/StartIDealTransactie', JSON.stringify({
            LID_ID: lidID,
            BESTELLING_ID: bestellingID,
            BANK_ID: bankID,
            url: url
        }));
        return response.json();
    }


    async addTransactie(transactie: HeliosTransactie) {
        const response: Response = await this.apiService.post('Transacties/SaveObject', JSON.stringify(transactie));
        return response.json();
    }
}
