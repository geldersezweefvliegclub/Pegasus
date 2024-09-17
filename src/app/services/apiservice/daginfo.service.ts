import { Injectable } from '@angular/core';
import { APIService } from './api.service';
import { DateTime } from 'luxon';
import { KeyValueArray } from '../../types/Utils';
import { HeliosDagInfo, HeliosDagInfoDagen, HeliosDagInfosDataset, HeliosRoosterDataset } from '../../types/Helios';
import { StorageService } from '../storage/storage.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SharedService } from '../shared/shared.service';
import { LoginService } from './login.service';
import { RoosterService } from './rooster.service';
import { CustomJsonSerializer } from '../../utils/Utils';

@Injectable({
    providedIn: 'root'
})
export class DaginfoService {
    private dagInfoTotaalCache: HeliosDagInfoDagen = { dataset: []}; // return waarde van API call
    private dagenCache: HeliosDagInfoDagen = { dataset: []};         // return waarde van API call

    private datumAbonnement: Subscription;         // volg de keuze van de kalender
    private datum: DateTime = DateTime.now();      // de gekozen dag

    public dagInfo: HeliosDagInfo = {};             // hier kunnen de componenten de daginfo ophalen (bijv start invoer)
    private dagInfoStore = new BehaviorSubject(this.dagInfo);
    public readonly dagInfoChange = this.dagInfoStore.asObservable();      // nieuwe dagInfo beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService,
                private readonly roosterService: RoosterService) {

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            });

            this.getDagInfo(undefined, this.datum).then(di => {
                this.dagInfoStore.next(this.dagInfo)    // afvuren event
            });
        });
    }

    // haal op, op welke dag er daginfo ingevoerd is
    async getDagen(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosDagInfosDataset[]> {

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        const getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;
        getParams['VELDEN'] = "ID,DATUM";

        try {
            const response: Response = await this.apiService.get('Daginfo/GetObjects', getParams);

            this.dagenCache = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) {       // er is geen starts
                throw(e);
            }
            return [];
        }
        return this.dagenCache?.dataset as [];
    }


    async getDagInfoDagen(verwijderd = false, startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosDagInfosDataset[]> {
        const getParams: KeyValueArray = params;

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.dagInfoTotaalCache != undefined)  && (this.dagInfoTotaalCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.dagInfoTotaalCache.hash;
        }
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.apiService.get('Daginfo/GetObjects', getParams);
            this.dagInfoTotaalCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) {       // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.dagInfoTotaalCache?.dataset as [];
    }

    // haal de daginfo op van een enkele dag
    async getDagInfo(id: number | undefined, datum: DateTime | undefined): Promise<HeliosDagInfo> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }

        try {
            // we halen de starts op met een ID
            if (id) {
                const response: Response = await this.apiService.get('Daginfo/GetObject', {'ID': id.toString()});
                this.dagInfo = await response.json();
            }

            // we halen de starts op met een datum (hebben geen ID nodig)
            if (datum) {
                const response: Response = await this.apiService.get('Daginfo/GetObject', {'DATUM': datum.toISODate() as string});
                this.dagInfo = await response.json();
            }
            return this.dagInfo;
        } catch (e) {
            const rooster: HeliosRoosterDataset[] = await this.roosterService.getRooster(this.datum, this.datum);
            this.dagInfo = {
                DATUM: this.datum.toISODate() as string,
                DDWV: (rooster.length > 0) ? rooster[0].DDWV : false,
                CLUB_BEDRIJF: (rooster.length > 0) ? rooster[0].CLUB_BEDRIJF : false,
                VELD_ID: undefined,
                STARTMETHODE_ID: undefined,
                VLIEGBEDRIJF: "",
                METEO: "",
                INCIDENTEN: "",
                ROLLENDMATERIEEL: "",
                VLIEGENDMATERIEEL: "",
                VERSLAG: "",
                DIENSTEN: ""
            };
            return this.dagInfo;
        }
    }

    // opslaan van een nieuw daginfo record
    async addDagInfo(daginfo: HeliosDagInfo) {
        const response: Response = await this.apiService.post('Daginfo/SaveObject', JSON.stringify(daginfo));

        // opslaan als class variable en fire event
        response.clone().json().then((di) => {
            this.dagInfo = di;
            this.dagInfoStore.next(this.dagInfo)
        });
        return response.json();
    }

    // update een bestaand daginfo record
    async updateDagInfo(daginfo: HeliosDagInfo) {
        const response: Response = await this.apiService.put('Daginfo/SaveObject', JSON.stringify(daginfo, CustomJsonSerializer));

        // opslaan als class variable en fire event
        response.clone().json().then((di) => {
            this.dagInfo = di;
            this.dagInfoStore.next(this.dagInfo)
        });
        return response.json();
    }

    // deze dag kan verwijderd worden
    async deleteDagInfo(id: number) {
        await this.apiService.delete('Daginfo/DeleteObject', {'ID': id.toString()});
    }

    // haal een verwijderd record terug
    async restoreDagInfo(id: number) {
        await this.apiService.patch('Daginfo/RestoreObject', {'ID': id.toString()});
    }
}
