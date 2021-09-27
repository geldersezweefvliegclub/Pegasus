import {Injectable} from '@angular/core';
import {APIService} from './api.service';

import {
    HeliosAanwezigLedenDataset,
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
    private starts: HeliosStarts = { dataset: []};
    private vorigVerzoekStarts: string = '';                            // parameters van vorige call

    private vliegdagen: HeliosVliegdagen = { dataset: []};
    private vorigVerzoekVliegdagen: string = '';                        // parameters van vorige call

    private logboek: HeliosLogboek = { dataset: []};                    // logboek vlieger
    private vorigVerzoekLogboek: string = '';                           // parameters van vorige call

    private logboekTotalen: HeliosLogboekTotalen | null = null;         // totalen logboek voor vlieger
    private vorigVerzoekLogboekTotalen: string = '';                    // parameters van vorige call

    private vliegtuigLogboek: HeliosVliegtuigLogboek = { dataset: []};
    private vorigVerzoekVliegtuigLogboek: string = '';                  // parameters van vorige call

    private vliegtuigLogboekTotalen: HeliosVliegtuigLogboekTotalen;
    private vorigVerzoekVliegtuigLogboekTotalen: string = '';           // parameters van vorige call

    constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {
    }

    async getVliegdagen(startDatum: DateTime, eindDatum: DateTime): Promise<[]> {

        let getParams: parameters = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekVliegdagen) {
            return this.vliegdagen?.dataset as [];
        }
        else
        {
            this.vorigVerzoekVliegdagen = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekVliegdagen = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response: Response = await this.APIService.get('Startlijst/GetVliegDagen',
                getParams
            );

            this.vliegdagen = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) { // er is geen data
                throw(e);
            }
        }
        return this.vliegdagen?.dataset as [];
    }

    async getLogboek(id: number, startDatum: DateTime, eindDatum: DateTime, maxRecords?: number): Promise<HeliosLogboekDataset[]> {
        let hash: string = '';
        if (((this.logboek == null)) && (this.storageService.ophalen('vlogboek-'+id.toString())  != null)) {
            this.logboek = this.storageService.ophalen('vlogboek-'+id.toString());
        }

        let getParams: parameters = {};

        if (this.logboek != null) {             // we hebben eerder de lijst opgehaald
            hash = (this.logboek) ? this.logboek.hash as string : '';
      //      getParams['HASH'] = hash;
        }

        getParams['LID_ID'] = id.toString();
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (maxRecords) {
            getParams['MAX'] = maxRecords.toString();
        }

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekLogboek) {
            return this.logboek?.dataset as [];
        }
        else
        {
            this.vorigVerzoekLogboek = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekLogboek = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response: Response = await this.APIService.get('Startlijst/GetLogboek', getParams);

            this.logboek = await response.json();
            this.storageService.opslaan('vlogboek-'+id.toString(), this.logboek);
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 404)) { // er is geen data, of data is ongewijzigd
                throw(e);
            }
        }
        return this.logboek?.dataset as HeliosLogboekDataset[];
    }

    async getLogboekTotalen(id: number, jaar:number): Promise<HeliosLogboekTotalen> {
        interface parameters {
            [key: string]: string;
        }

        let getParams: parameters = {};
        getParams['LID_ID'] = id.toString();
        getParams['JAAR'] = jaar.toString();

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekLogboekTotalen) {
            return this.logboekTotalen as HeliosLogboekTotalen
        }
        else
        {
            this.vorigVerzoekLogboekTotalen = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekLogboekTotalen = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekVliegtuigLogboek) {
            return this.vliegtuigLogboek?.dataset as [];
        }
        else
        {
            this.vorigVerzoekVliegtuigLogboek = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekVliegtuigLogboek = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response: Response = await this.APIService.get('Startlijst/GetVliegtuigLogboek',
                getParams
            );

            this.vliegtuigLogboek = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) { // er is geen data
                throw(e);
            }
        }
        return this.vliegtuigLogboek?.dataset as [];
    }

    async getVliegtuigLogboekTotalen(id: number, jaar:number): Promise<HeliosVliegtuigLogboekTotalen> {
        let getParams: parameters = {};
        getParams['ID'] = id.toString();
        getParams['JAAR'] = jaar.toString();

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekVliegtuigLogboekTotalen) {
            return this.vliegtuigLogboekTotalen as HeliosVliegtuigLogboekTotalen;
        }
        else
        {
            this.vorigVerzoekVliegtuigLogboekTotalen = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekVliegtuigLogboekTotalen = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

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

        if (((this.starts == null)) && (this.storageService.ophalen('starts') != null)) {
            this.starts = this.storageService.ophalen('starts');
        }

        let getParams: KeyValueArray = params;

        if (this.starts != null) { // we hebben eerder de lijst opgehaald
            hash = this.starts.hash as string;
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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekStarts) {
            return this.starts?.dataset as HeliosStartDataset[];
        }
        else
        {
            this.vorigVerzoekStarts = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekStarts = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            const response: Response = await this.APIService.get('Startlijst/GetObjects', getParams );

            this.starts = await response.json();
            this.storageService.opslaan('starts', this.starts);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.starts?.dataset as [];
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
