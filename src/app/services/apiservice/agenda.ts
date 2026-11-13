import { Injectable, inject } from '@angular/core';
import { DateTime } from 'luxon';
import { APIService } from './api.service';
import { KeyValueArray } from '../../types/Utils';
import { HeliosAgenda, HeliosAgendaActiviteit, HeliosAgendaDataset, HeliosRoosterDataset } from '../../types/Helios';
import { LoginService } from './login.service';
import { naarApiTijd } from '../../utils/Utils';

@Injectable({
    providedIn: 'root'
})
export class AgendaService {
    private readonly apiService = inject(APIService);
    private readonly loginService = inject(LoginService);

    private agendaCache: HeliosAgenda = {dataset: []};    // return waarde van API call

    async getAgenda(startDatum: DateTime, eindDatum: DateTime, max?: number, verwijderd = false): Promise<HeliosAgendaDataset[]> {
        const getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;
        if (max) {
            getParams['MAX'] = max;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = 1;
        }

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.agendaCache != undefined)  && (this.agendaCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.agendaCache.hash;
        }

        try {
            const response: Response = await this.apiService.get('Agenda/GetObjects', getParams);
            this.agendaCache = await response.json();

        } catch (e) {

            if (e.responseCode === 404) { // er is geen starts
                return [];
            }

            if ((e.responseCode !== 304) && (e.responseCode !== 704)) {  // er is geen nieuwe starts
                throw(e);
            }
        }
        return this.agendaCache!.dataset as HeliosRoosterDataset[];
    }

    async getActiviteit(id: number): Promise<HeliosAgendaActiviteit> {
        const response: Response = await this.apiService.get('Agenda/GetObject', {'ID': id.toString()});
        return response.json();
    }

    async addActiviteit(activiteit: HeliosAgendaActiviteit) {
        const response: Response = await this.apiService.post('Agenda/SaveObject', JSON.stringify(this.naarApiFormaat(activiteit)));
        return response.json();
    }

    async updateActiviteit(activiteit: HeliosAgendaActiviteit) {
        const response: Response = await this.apiService.put('Agenda/SaveObject', JSON.stringify(this.naarApiFormaat(activiteit)));

        return response.json();
    }

    async deleteActiviteit(id: number) {
        await this.apiService.delete('Agenda/DeleteObject', {'ID': id.toString()});
    }

    async restoreActiviteit(id: number) {
        await this.apiService.patch('Journaal/RestoreObject', {'ID': id.toString()});
    }

    // TIJD komt als "HH:mm" uit de timepicker of "HH:mm:ss" uit GetObjects, Helios.js wil een ISO 8601 datum string.
    // Een leeggemaakte tijd wordt null, zodat de server hem ook echt wist
    private naarApiFormaat(activiteit: HeliosAgendaActiviteit): HeliosAgendaActiviteit {
        return {...activiteit, TIJD: naarApiTijd(activiteit.DATUM, activiteit.TIJD)};
    }
}
