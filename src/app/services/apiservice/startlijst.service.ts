import {Injectable} from '@angular/core';
import {APIService} from './api.service';

import {
    HeliosLogboek, HeliosLogboekDataset, HeliosLogboekTotalen, HeliosRecency,
    HeliosStart, HeliosStartDataset,
    HeliosStarts,
    HeliosVliegdagen,
    HeliosVliegtuigLogboek,
    HeliosVliegtuigLogboekTotalen
} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueArray} from '../../types/Utils';
import {DateTime} from 'luxon';

interface parameters {
    [key: string]: string;
}

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

    constructor(private readonly APIService: APIService,
                private readonly storageService: StorageService) {
    }

    async getVliegdagen(startDatum: DateTime, eindDatum: DateTime): Promise<[]> {
        let getParams: parameters = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        try {
            const response: Response = await this.APIService.get('Startlijst/GetVliegDagen',
                getParams
            );

            this.vliegdagenCache = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) { // er is geen data
                throw(e);
            }
        }
        return this.vliegdagenCache?.dataset as [];
    }

    async getLogboek(id: number, startDatum: DateTime, eindDatum: DateTime, maxRecords?: number): Promise<HeliosLogboekDataset[]> {
        let hash: string = '';
        if (((this.logboekCache == null)) && (this.storageService.ophalen('vlogboek-'+id.toString())  != null)) {
            this.logboekCache = this.storageService.ophalen('vlogboek-'+id.toString());
        }

        let getParams: parameters = {};

        if (this.logboekCache != null) {             // we hebben eerder de lijst opgehaald
            hash = (this.logboekCache) ? this.logboekCache.hash as string : '';
      //      getParams['HASH'] = hash;
        }

        getParams['LID_ID'] = id.toString();
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (maxRecords) {
            getParams['MAX'] = maxRecords.toString();
        }

        try {
            const response: Response = await this.APIService.get('Startlijst/GetLogboek', getParams);

            this.logboekCache = await response.json();
            this.storageService.opslaan('vlogboek-'+id.toString(), this.logboekCache);
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 404)) { // er is geen data, of data is ongewijzigd
                throw(e);
            }
        }
        return this.logboekCache?.dataset as HeliosLogboekDataset[];
    }

    async getLogboekTotalen(id: number, jaar:number): Promise<HeliosLogboekTotalen> {
        interface parameters {
            [key: string]: string;
        }

        let getParams: parameters = {};
        getParams['LID_ID'] = id.toString();
        getParams['JAAR'] = jaar.toString();

        try {
            const response: Response = await this.APIService.get('Startlijst/GetLogboekTotalen', getParams);

            this.logboekTotalen = await response.json();
        } catch (e) {
            throw(e);
        }
        return this.logboekTotalen as HeliosLogboekTotalen;
    }

    async getVliegtuigLogboek(id: number, startDatum: DateTime, eindDatum: DateTime): Promise<HeliosLogboekDataset[]> {

        let getParams: parameters = {};
        getParams['ID'] = id.toString();
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        try {
            const response: Response = await this.APIService.get('Startlijst/GetVliegtuigLogboek',
                getParams
            );

            this.vliegtuigLogboekCache = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) { // er is geen data
                throw(e);
            }
        }
        return this.vliegtuigLogboekCache?.dataset as [];
    }

    async getVliegtuigLogboekTotalen(id: number, jaar:number): Promise<HeliosVliegtuigLogboekTotalen> {
        let getParams: parameters = {};
        getParams['ID'] = id.toString();
        getParams['JAAR'] = jaar.toString();

        try {
            const response: Response = await this.APIService.get('Startlijst/GetVliegtuigLogboekTotalen',
                getParams
            );

            this.vliegtuigLogboekTotalen = await response.json();
        } catch (e) {
            //todo nutteloze catch?
            throw(e);
        }
        return this.vliegtuigLogboekTotalen;
    }

    async getStarts(verwijderd: boolean = false, startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise< HeliosStartDataset[]> {
        let hash: string = '';

        if (((this.startsCache == null)) && (this.storageService.ophalen('starts') != null)) {
            this.startsCache = this.storageService.ophalen('starts');
        }

        let getParams: KeyValueArray = params;

        if (this.startsCache != null) { // we hebben eerder de lijst opgehaald
            hash = this.startsCache.hash as string;
//            getParams['HASH'] = hash;
        }

        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.APIService.get('Startlijst/GetObjects', getParams );

            this.startsCache = await response.json();
            this.storageService.opslaan('starts', this.startsCache);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.startsCache?.dataset as [];
    }

    async getStart(id: number): Promise<HeliosStart> {
        const response: Response = await this.APIService.get('Startlijst/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async getRecency(lidID: number, datum?: DateTime): Promise<HeliosRecency> {

        let getParams: KeyValueArray = {};
        getParams['VLIEGER_ID'] = lidID.toString();

        if (datum) {
            getParams['DATUM'] = datum.toISODate();
        }

        const response: Response = await this.APIService.get('Startlijst/GetRecency', getParams);
        return response.json();
    }

    async addStart(start: HeliosStart) {
        const response: Response = await this.APIService.post('Startlijst/SaveObject', JSON.stringify(start));
        return response.json();
    }

    async updateStart(start: HeliosStart) {
        const response: Response = await this.APIService.put('Startlijst/SaveObject', JSON.stringify(start));

        return response.json();
    }

    async deleteStart(id: number) {
        try {
            await this.APIService.delete('Startlijst/DeleteObject', {'ID': id.toString()});
        } catch (e) {
            // todo nutteloze catch?
            throw(e);
        }
    }

    async restoreStart(id: number) {
        try {
            await this.APIService.patch('Startlijst/RestoreObject', {'ID': id.toString()});
        } catch (e) {
            throw(e);
        }
    }

    async startTijd(id: number, tijd: string) {
        const response: Response = await this.APIService.put('Startlijst/SaveObject', JSON.stringify({ID: id,STARTTIJD: (tijd) ? tijd : null }));

        return response.json();
    }

    async landingsTijd(id: number, tijd: string) {
        const response: Response = await this.APIService.put('Startlijst/SaveObject', JSON.stringify({ID: id,LANDINGSTIJD: (tijd) ? tijd : null }));

        return response.json();
    }
}
