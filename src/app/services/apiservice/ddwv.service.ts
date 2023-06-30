import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {HeliosConfigDDWV} from "../../types/Helios";
import {StorageService} from "../storage/storage.service";
import {DateTime, Interval} from "luxon";
import {KeyValueArray} from "../../types/Utils";

@Injectable({
    providedIn: 'root'
})
export class DdwvService {

    private configDDWV: HeliosConfigDDWV;

    constructor(private readonly apiService: APIService,
                private readonly storageService: StorageService) {
        // We hebben misschien eerder de lidTypes opgehaald. Die gebruiken we totdat de API starts heeft opgehaald
        if (this.storageService.ophalen('configDDWV') != null) {
            this.configDDWV = this.storageService.ophalen('configDDWV');
        }
    }

    public async loadConfigDDWV() {
        const response = await this.apiService.get('DDWV/GetConfiguratie');
        this.configDDWV = await response.json();
        this.storageService.opslaan('configDDWV', this.configDDWV, -1);
    }

    public actief(): boolean {
        if (!this.configDDWV) return false;
        return this.configDDWV.DDWV!;
    }

    public magBestellen(strippen: number | undefined): boolean {
        if (!this.configDDWV) return false;
        if (!this.configDDWV.MAX_STRIPPEN) return false;

        return ((!strippen) || (strippen < this.configDDWV.MAX_STRIPPEN)) ? true : false;
    }

    public getTransactieTypeID(datum: DateTime): number {
        const nu: DateTime = DateTime.now();

        if (nu.startOf('day') > datum.startOf('day')) {

            return -1;
        }
        const diff = Interval.fromDateTimes(nu.startOf('day'), datum.startOf('day'));

        let dagen = diff.length("days");
        if ((dagen == 1) && (nu.hour > 21)) {
            dagen--;
        }

        if (!this.configDDWV) return -1;
        if (!this.configDDWV.TARIEVEN) return -1;

        const typeID = (this.configDDWV.TARIEVEN[dagen]) ? this.configDDWV.TARIEVEN[dagen] : this.configDDWV.TARIEVEN['default']
        return +typeID;
    }

    async betaalCrew(datum: string, IDs: string): Promise<void> {
        let getParams: KeyValueArray = {};

        getParams['DATUM'] = datum;
        getParams['DIENSTEN'] = IDs;

        const obj = {
            "DATUM": datum,
            "DIENSTEN": IDs
        }

        try {
            const response: Response = await this.apiService.post('DDWV/UitbetalenCrew', JSON.stringify(obj));
        } catch (e) {
            throw(e);
        }
    }
}
