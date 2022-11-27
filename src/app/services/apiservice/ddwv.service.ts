import {Injectable} from '@angular/core';
import {SharedService} from "../shared/shared.service";
import {APIService} from "./api.service";
import {HeliosBestelInfo, HeliosConfigDDWV} from "../../types/Helios";

@Injectable({
    providedIn: 'root'
})
export class DdwvService {

    private configDDWV: HeliosConfigDDWV;

    constructor(private readonly apiService: APIService,
                private readonly sharedService: SharedService) {
    }

    public loadConfigDDWV() {
        this.apiService.get('DDWV/GetConfiguratie').then((response: Response) => {
            response.json().then((c) => this.configDDWV = c);
        });
    }

    public actief(): boolean {
        if (!this.configDDWV)  return false;
        return this.configDDWV.DDWV!;
    }

    public getBestelInfo(): HeliosBestelInfo[] {
        console.log(this.configDDWV);

        if (!this.configDDWV)
            return [];

        if (!this.configDDWV.AANSCHAF)
            return [];

        return this.configDDWV.AANSCHAF!;
    }
}
