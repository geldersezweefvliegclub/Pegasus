import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {HeliosReservering, HeliosReserveringen, HeliosReserveringenDataset} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {DateTime} from "luxon";

@Injectable({
    providedIn: 'root'
})
export class ReserveringService {

    private reserveringenCache: HeliosReserveringen = { dataset: []};                      // return waarde van API call

    constructor(private readonly apiService: APIService) {
    }

    async getReserveringen(startDatum: DateTime, eindDatum: DateTime, maxRecords?: number): Promise<HeliosReserveringenDataset[]> {
        let getParams: KeyValueArray = {};

        if ((this.reserveringenCache != undefined)  && (this.reserveringenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.reserveringenCache.hash;
        }

        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (maxRecords) {
            getParams['MAX'] = maxRecords.toString();
        }

        try {
            const response: Response = await this.apiService.get('Reservering/GetObjects', getParams);
            this.reserveringenCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704) && (e.responseCode !== 404)) { // er is geen data, of data is ongewijzigd
                throw(e);
            }
        }
        return this.reserveringenCache?.dataset as HeliosReserveringenDataset[];
    }

    async addReservering(reservering: HeliosReservering) {
        try {
            const response: Response = await this.apiService.post('Reservering/SaveObject', JSON.stringify(reservering));
            return response.json();
        }
        catch (e) {
            throw (e);
        }
        return undefined;
    }

    async deleteReservering(id: number) {
        await this.apiService.delete('Reservering/DeleteObject', {'ID': id.toString()});
    }
}
