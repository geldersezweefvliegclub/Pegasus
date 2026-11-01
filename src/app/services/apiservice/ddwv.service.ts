import { Injectable, inject } from '@angular/core';
import { APIService } from './api.service';
import { DateTime } from 'luxon';
import { KeyValueArray } from '../../types/Utils';

@Injectable({
    providedIn: 'root'
})
export class DdwvService {
    private readonly apiService = inject(APIService);

    async betaalCrew(datum: string, IDs: string): Promise<void> {
        const getParams: KeyValueArray = {};

        getParams['DATUM'] = datum;
        getParams['DIENSTEN'] = IDs;

        const obj = {
            "DATUM": datum,
            "DIENSTEN": IDs
        }

        await this.apiService.post('DDWV/UitbetalenCrew', JSON.stringify(obj));
    }

    async maakTransacties(datum: DateTime) {
        const response: Response = await this.apiService.post('DDWV/MaakTransacties', JSON.stringify({DATUM: datum.toISODate()}));

        return response.json();
    }
}
