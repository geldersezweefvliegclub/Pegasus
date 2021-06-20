import {Injectable} from '@angular/core';
import {APIService} from '../apiservice/api.service';

import {HeliosStarts, HeliosVliegtuig, HeliosVliegdagen, HeliosStart} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {KeyValueString} from "../../types/Utils";
import {DateTime} from "luxon";

@Injectable({
    providedIn: 'root'
})
export class StartlijstService {
    starts: HeliosStarts | null = null;
    vliegdagen: HeliosVliegdagen | null = null;

    constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {
    }

    async getVliegdagen(startDatum: DateTime, eindDatum: DateTime): Promise<[]> {
        interface parameters {
            [key: string]: string;
        }

        let getParams: parameters = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

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

    async getStarts(verwijderd: boolean = false, startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueString = {}): Promise<[]> {
        let hash: string = '';

        if (((this.starts == null)) && (this.storageService.ophalen('starts') != null)) {
            this.starts = this.storageService.ophalen('starts');
        }

        let getParams: KeyValueString = params;

        if (this.starts != null) { // we hebben eerder de lijst opgehaald
            hash = this.starts.hash as string;
            getParams['HASH'] = hash;
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

    async nieuweStart(vliegtuig: HeliosStart) {
        const response: Response = await this.APIService.post('Startlijst/SaveObject', JSON.stringify(vliegtuig));
        return response.json();
    }

    async updateStart(vliegtuig: HeliosStart) {
        const response: Response = await this.APIService.put('Startlijst/SaveObject', JSON.stringify(vliegtuig));

        return response.json();
    }

    async deleteStart(id: number) {
        try {
            await this.APIService.delete('Startlijst/DeleteObject', {'ID': id.toString()});
        } catch (e) {
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
