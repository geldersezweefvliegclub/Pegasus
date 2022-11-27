import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {LoginService} from "./login.service";
import {HeliosBestelInfo, HeliosTransactie, HeliosTransacties, HeliosTransactiesDataset} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {DateTime} from "luxon";

export interface BankIDeal {
    bankID: string,
    beschrijving: string | null
};

@Injectable({
    providedIn: 'root'
})
export class TransactiesService {
    private transactiesCache: HeliosTransacties = { dataset: []};      // return waarde van API call


    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService) {
    }

    async getTransacties(lidID?: number, startDatum?: DateTime, eindDatum?: DateTime, max?: number): Promise<HeliosTransactiesDataset[]> {
        let getParams: KeyValueArray = {};

        if ((this.transactiesCache != undefined) && (this.transactiesCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.transactiesCache.hash;
        }
        if (lidID && lidID >= 0) {
            getParams['LID_ID'] = lidID.toString();
        }
        if (startDatum) {
            getParams['BEGIN_DATUM'] = startDatum.toISODate();
        }
        if (eindDatum) {
            getParams['EIND_DATUM'] = eindDatum.toISODate();
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

    async getBanken(): Promise<BankIDeal[]> {
        const retVal:BankIDeal[] = [];
        try {
            const response: Response = await this.apiService.get('Transacties/GetBanken');
            const banken = await response.json();
            Object.keys(banken.response.bank).forEach((key) => {
                retVal.push({
                    bankID: key,
                    beschrijving: banken.response.bank[key]
                });
            })

        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return retVal;
    }

    async addTransactie(transactie: HeliosTransactie) {
        const response: Response = await this.apiService.post('Transacties/SaveObject', JSON.stringify(transactie));
        return response.json();
    }
}
