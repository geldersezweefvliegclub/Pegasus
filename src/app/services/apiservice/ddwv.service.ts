import {Injectable} from '@angular/core';
import {SharedService} from "../shared/shared.service";
import {APIService} from "./api.service";
import {HeliosConfigDDWV} from "../../types/Helios";
import {StorageService} from "../storage/storage.service";

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
        if (!this.configDDWV)  return false;
        return this.configDDWV.DDWV!;
    }

    public magBestellen(strippen: number | undefined): boolean {
        if (!this.configDDWV)  return false;
        if (!this.configDDWV.MAX_STRIPPEN)  return false;

        return ((!strippen) || (strippen < this.configDDWV.MAX_STRIPPEN)) ? true : false;
    }
}
