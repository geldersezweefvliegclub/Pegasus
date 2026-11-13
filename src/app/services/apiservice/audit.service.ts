import { Injectable, inject } from '@angular/core';
import { APIService } from './api.service';
import { HeliosAudit } from '../../types/Helios';
import { KeyValueArray } from '../../types/Utils';
import { LoginService } from './login.service';

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private readonly apiService = inject(APIService);
    private readonly loginService = inject(LoginService);

    // Haal een blok audit records op, nieuwste eerst (ID DESC). Met MAX leest de server alleen dit blok en geeft hij
    // in totaal het aantal records dat aan de selectie voldoet. Met totID haal je het volgende blok op: alle records
    // met een lager ID. Dat blijft kloppen als er tussendoor nieuwe audit records bijkomen, START zou dan verschuiven.
    async getAudit(zoekString: string, max: number, totID?: number): Promise<HeliosAudit> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {dataset: [], totaal: 0};
        }

        const getParams: KeyValueArray = {'MAX': max.toString()};
        if (totID !== undefined) {
            getParams['EIND_ID'] = (totID - 1).toString();
        }
        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        const response = await this.apiService.get('Audit/GetObjects', getParams);
        return response.json();
    }
}
