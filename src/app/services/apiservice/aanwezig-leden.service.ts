import {Injectable} from '@angular/core';
import {DateTime} from 'luxon';
import {HeliosActie, KeyValueArray} from '../../types/Utils';
import {APIService} from './api.service';
import {
    HeliosAanwezigLeden,
    HeliosAanwezigLedenDataset,
    HeliosAanwezigSamenvatting,
    HeliosAanwezigVliegtuigenDataset
} from '../../types/Helios';
import {BehaviorSubject, Subscription} from "rxjs";
import {SharedService} from "../shared/shared.service";
import {debounceTime} from "rxjs/operators";
import {LoginService} from "./login.service";


@Injectable({
    providedIn: 'root'
})
export class AanwezigLedenService {
    private aanwezigCache: HeliosAanwezigLeden = {dataset: []};     // return waarde van API call
    private aanwezigDagCache: HeliosAanwezigLedenDataset[] = [];    // cache van de gekozen dag
    private datumAbonnement: Subscription;                          // volg de keuze van de kalender
    private datum: DateTime = DateTime.now();                       // de gekozen dag

    private overslaan = false;
    private ophaalTimer: number;                                // Iedere 15 min halen we de aanwezige leden op
    private aanwezigStore = new BehaviorSubject(this.aanwezigCache.dataset);
    public readonly aanwezigChange = this.aanwezigStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            });

            // we kunnen alleen starts ophalen als we ingelogd zijn
            if (this.loginService.isIngelogd()) {
                this.overslaan = false;     // bij wijzigen datum nooit overslaan
                this.updateAanwezigCache()
            }

            // Als we vandaag geselecteerd hebben, halen we iedere 15 min de starts van de server
            // Iemand kan zich aangemeld hebben, bijv via de app
            if (this.datum.toISODate() == DateTime.now().toISODate()) {
                this.ophaalTimer = window.setInterval(() => {
                    this.updateAanwezigCache()
                }, 1000 * 60 * 15);
            }
            else {
                clearInterval(this.ophaalTimer);
            }
        });

        // Als start is toegevoegd, dan kan lid aanwezig gemeld worden
        this.sharedService.heliosEventFired.pipe(debounceTime(1000)).subscribe(ev => {
            if (ev.tabel == "Startlijst") {
                this.updateAanwezigCache();
            }

            if (ev.tabel == "AanwezigLeden") {
                this.updateAanwezigCache()
            }
        });

        // nadat we ingelogd zijn kunnen we de aanwezige leden ophalen
        loginService.inloggenSucces.subscribe(() => {
            this.updateAanwezigCache();
        });
    }

    async updateAanwezigCache(force = false) {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return undefined;
        }

        if (this.overslaan && force === false) {
            return this.aanwezigDagCache;
        }

        this.overslaan = true;
        setTimeout(() => this.overslaan = false, 1000 * 5)
        this.getAanwezig(this.datum, this.datum).then((dataset) => {
            this.aanwezigDagCache = dataset;
            this.aanwezigStore.next(this.aanwezigDagCache)    // afvuren event
        });
    }

    // Ophalen van alle leden die zich aangemeld hebben
    async getAanwezig(startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosAanwezigLedenDataset[]> {
        const getParams: KeyValueArray = params;

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.aanwezigCache != undefined)  && (this.aanwezigCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.aanwezigCache.hash;
        }
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        try {
            const response: Response = await this.apiService.get('AanwezigLeden/GetObjects', getParams);
            this.aanwezigCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.aanwezigCache.dataset as HeliosAanwezigLedenDataset[];
    }

    // Ophalen va leden die zich uitgeschreven hebben
    async getAanwezigVerwijderd(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosAanwezigLedenDataset[]> {
        const getParams: KeyValueArray = {};

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;
        getParams['VERWIJDERD'] = 'true';      // Leden die zich uitgeschreven hebben, hebben hun aanmelding verwijderd

        const response: Response = await this.apiService.get('AanwezigLeden/GetObjects', getParams);
        const obj = await response.json();

        return obj.dataset as HeliosAanwezigLedenDataset[];
    }


    async getSamenvatting(datum: DateTime): Promise<HeliosAanwezigSamenvatting> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }
        const response: Response = await this.apiService.get('AanwezigLeden/Samenvatting', {'DATUM': datum.toISODate() as string});
        return response.json();
    }

    async getAanwezigLid(id: number): Promise<HeliosAanwezigLedenDataset> {
        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return {};
        }
        const response: Response = await this.apiService.get('AanwezigLeden/GetObject', {'ID': id.toString()});
        return response.json();
    }

    async aanmelden(record: HeliosAanwezigVliegtuigenDataset): Promise<any> {
        const response: Response = await this.apiService.post('AanwezigLeden/Aanmelden', JSON.stringify(record));
        return response.json();
    }

    async aanmeldingVerwijderen(id: number) {
        await this.apiService.delete('AanwezigLeden/DeleteObject', {'ID': id.toString()});
    }

    async afmelden(lidID: number): Promise<any> {
        const response: Response = await this.apiService.post('AanwezigLeden/Afmelden', JSON.stringify({ LID_ID: lidID }));
        return response.json();
    }

    async updateAanmelding(record: HeliosAanwezigLedenDataset): Promise<any> {
        const response: Response = await this.apiService.put('AanwezigLeden/SaveObject', JSON.stringify(record));
        return response.json();
    }

    async deleteAanmelding(id: number) {
        await this.apiService.delete('AanwezigLeden/DeleteObject', {'ID': id.toString()});
    }
}
