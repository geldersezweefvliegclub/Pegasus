import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {HeliosAudit, HeliosAuditDataset} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';
import {LoginService} from "./login.service";

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private auditCache: HeliosAudit = {dataset: []};        // return waarde van API call

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {
    }

    async getAudit(zoekString: string): Promise<HeliosAuditDataset[]> {
        const getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.auditCache != undefined) && (this.auditCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.auditCache.hash;
        }
        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        try {
            const response = await this.apiService.get('Audit/GetObjects', getParams);
            this.auditCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.auditCache?.dataset as HeliosAuditDataset[];
    }
}
