import { Injectable } from '@angular/core';
import { APIService } from './api.service';
import { HeliosDocument, HeliosDocumenten, HeliosDocumentenDataset } from '../../types/Helios';
import { KeyValueArray } from '../../types/Utils';
import { StorageService } from '../storage/storage.service';
import { LoginService } from './login.service';

@Injectable({
    providedIn: 'root'
})
export class DocumentenService {
    private documentenCache: HeliosDocumenten = {dataset: []};      // return waarde van API call

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly storageService: StorageService) {

        // We hebben misschien eerder de documenten opgehaald. Die laden we alvast
        if (this.storageService.ophalen('documenten') != null) {
            this.documentenCache = this.storageService.ophalen('documenten');
        }
    }

    async getDocumenten(verwijderd = false, lid_id: number | undefined = undefined, groep: number | undefined = undefined): Promise<HeliosDocumentenDataset[]> {
        const getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if (groep) {
            getParams['GROEPEN'] = groep;
        }

        if (lid_id) {
            getParams['LID_ID'] = lid_id;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        if ((this.documentenCache != undefined)  && (this.documentenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.documentenCache.hash;
        }

        try {
            const response: Response = await this.apiService.get('Documenten/GetObjects', getParams);
            this.documentenCache = await response.json();
            this.storageService.opslaan('documenten', this.documentenCache);
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.documentenCache?.dataset as HeliosDocumentenDataset[];
    }

    async getDocument(id: number): Promise<HeliosDocument> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }
        const response: Response = await this.apiService.get('Documenten/GetObject', {'ID': id.toString()});
        return response.json();
    }

    async addDocument(doc: HeliosDocument) {
        const response: Response = await this.apiService.post('Documenten/SaveObject', JSON.stringify(doc));
        return response.json();
    }

    async updateDocument(doc: HeliosDocument) {
        const response: Response = await this.apiService.put('Documenten/SaveObject', JSON.stringify(doc));
        return response.json();
    }

    async deleteDocument(id: number) {
        await this.apiService.delete('Documenten/DeleteObject', {'ID': id.toString()});
    }

    async restoreDocument(id: number) {
        await this.apiService.patch('Documenten/RestoreObject', {'ID': id.toString()});
    }
}

