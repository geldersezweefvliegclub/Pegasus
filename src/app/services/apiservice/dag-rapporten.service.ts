import {Injectable} from '@angular/core';
import {APIService} from "./api.service";
import {
    HeliosDagInfosDataset,
    HeliosDagRapport,
    HeliosDagRapporten,
    HeliosDagRapportenDataset
} from "../../types/Helios";
import {KeyValueArray} from "../../types/Utils";
import {LoginService} from "./login.service";
import {DateTime} from "luxon";


@Injectable({
    providedIn: 'root'
})
export class DagRapportenService {
    private rapportenCache: HeliosDagRapporten = {dataset: []};      // return waarde van API call
    private dagenCache: HeliosDagRapporten = { dataset: []};         // return waarde van API call

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService) {
    }

    async getDagRapporten(verwijderd: boolean = false, datum: string, max?: number): Promise<HeliosDagRapportenDataset[]> {
        // Alleen als we onderstaande rollen niet hebben, gaan we ook niets ophalen. DDWV crew/beheerder heeft niet altijd
        // toegang, dat wordt afgevangen door HMI en op de server. Onnodig om het hier ook te doen
        const ui = this.loginService.userInfo?.Userinfo;
        if (!ui?.isCIMT && !ui?.isInstructeur && !ui?.isBeheerder && !ui?.isDDWVCrew && !ui?.isBeheerderDDWV) {
            throw {beschrijving: "Niet gemachtigd om tracks te laden"};
        }

        let getParams: KeyValueArray = {};

        if ((this.rapportenCache != undefined) && (this.rapportenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.rapportenCache.hash;
        }
        if ((max) && (max > 0)) {
            getParams['MAX'] = max.toString();
        }
        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }
        getParams['DATUM'] = datum;
        try {
            const response: Response = await this.apiService.get('DagRapporten/GetObjects', getParams);
            this.rapportenCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.rapportenCache?.dataset as HeliosDagRapportenDataset[];
    }

    async getDagRapport(id: number): Promise<HeliosDagRapport> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }

        // Alleen als we onderstaande rollen niet hebben, gaan we ook niets ophalen. DDWV crew/beheerder heeft niet altijd
        // toegang, dat wordt afgevangen door HMI en op de server. Onnodig om het hier ook te doen
        const ui = this.loginService.userInfo?.Userinfo;
        if (!ui?.isCIMT && !ui?.isInstructeur && !ui?.isBeheerder && !ui?.isDDWVCrew && !ui?.isBeheerderDDWV) {
            throw {beschrijving: "Niet gemachtigd om tracks te laden"};
        }

        const response: Response = await this.apiService.get('DagRapporten/GetObject', {'ID': id.toString()});

        return response.json();
    }

    async addDagRapport(dr: HeliosDagRapport) {
        const response: Response = await this.apiService.post('DagRapporten/SaveObject', JSON.stringify(dr));
        return response.json();
    }

    async updateDagRapport(dr: HeliosDagRapport) {
        const response: Response = await this.apiService.put('DagRapporten/SaveObject', JSON.stringify(dr));
        return response.json();
    }

    async deleteDagRapport(id: number) {
        await this.apiService.delete('DagRapporten/DeleteObject', {'ID': id.toString()});
    }

    async restoreRapport(id: number) {
        await this.apiService.patch('DagRapporten/RestoreObject', {'ID': id.toString()});
    }

    // haal op, op welke dag er daginfo ingevoerd is
    async getDagen(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosDagInfosDataset[]> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if (!this.magDagInfoOphalen()) {
            return [];
        }

        let getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;
        getParams['VELDEN'] = "ID,DATUM";

        try {
            const response: Response = await this.apiService.get('DagRapporten/GetObjects', getParams);

            this.dagenCache = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) {       // er is geen starts
                throw(e);
            }
            return [];
        }
        return this.dagenCache?.dataset as [];
    }

    // als we weten dat gebruiker geen toegang heeft, hoeven we ook niets op te vragen
    magDagInfoOphalen(): boolean {
        const ui = this.loginService.userInfo?.Userinfo;
        return (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isInstructeur || ui?.isCIMT || ui?.isDDWVCrew) ? true : false;
    }
}
