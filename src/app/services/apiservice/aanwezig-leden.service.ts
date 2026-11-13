import { Injectable, inject } from '@angular/core';
import { DateTime } from 'luxon';
import { KeyValueArray } from '../../types/Utils';
import { naarApiTijd } from '../../utils/Utils';
import { APIService } from './api.service';
import {
  HeliosAanmelden,
  HeliosAanwezigLeden,
  HeliosAanwezigLidUpdate,
  HeliosAanwezigLedenDataset,
  HeliosAanwezigSamenvatting,
} from '../../types/Helios';
import { BehaviorSubject } from 'rxjs';
import { SharedService } from '../shared/shared.service';
import { debounceTime } from 'rxjs/operators';
import { LoginService } from './login.service';

@Injectable({
    providedIn: 'root'
})
export class AanwezigLedenService {
    private readonly apiService = inject(APIService);
    private readonly loginService = inject(LoginService);
    private readonly sharedService = inject(SharedService);

    private aanwezigCache = new Map<string, HeliosAanwezigLeden>(); // return waarde van API call, per opgevraagde periode/selectie
    private aanwezigDagCache: HeliosAanwezigLedenDataset[] = [];    // cache van de gekozen dag
    private datum: DateTime = DateTime.now();                       // de gekozen dag
    private overslaan = false;
    private ophaalTimer: number;                                // Iedere 15 min halen we de aanwezige leden op
    private aanwezigStore = new BehaviorSubject<HeliosAanwezigLedenDataset[]>([]);

    // afgeleid van bovenstaande variabelen, moet daarom na de declaratie ervan staan
    public readonly aanwezigChange = this.aanwezigStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    constructor() {
        // de datum zoals die in de kalender gekozen is
        // service leeft net zo lang als de app, dit abonnement hoeft nooit opgezegd te worden
        this.sharedService.ingegevenDatum.subscribe(datum => {
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
        this.loginService.inloggenSucces.subscribe(() => {
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
        const getParams: KeyValueArray = {...params};     // kopie, params van de aanroeper niet aanpassen

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        // de hash hoort bij een specifieke query, dus per periode/selectie/params bijhouden
        const cacheKey = JSON.stringify([startDatum.toISODate(), eindDatum.toISODate(), zoekString ?? '', params]);
        const cache = this.aanwezigCache.get(cacheKey);

        if (cache?.hash != undefined) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = cache.hash;
        }
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        try {
            const response: Response = await this.apiService.get('AanwezigLeden/GetObjects', getParams);
            const resultaat: HeliosAanwezigLeden = await response.json();
            this.aanwezigCache.set(cacheKey, resultaat);
            return [...(resultaat.dataset ?? [])] as HeliosAanwezigLedenDataset[];
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        // kopie teruggeven, zodat aanroepers de cache niet kunnen aanpassen
        return [...(cache?.dataset ?? [])] as HeliosAanwezigLedenDataset[];
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

    async aanmelden(record: HeliosAanwezigLedenDataset): Promise<any> {
        const response: Response = await this.apiService.post('AanwezigLeden/Aanmelden', JSON.stringify(this.naarAanmeldenFormaat(record)));
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
        const response: Response = await this.apiService.put('AanwezigLeden/SaveObject', JSON.stringify(this.naarUpdateFormaat(record)));
        return response.json();
    }

    async deleteAanmelding(id: number) {
        await this.apiService.delete('AanwezigLeden/DeleteObject', {'ID': id.toString()});
    }

    // Aanmelden accepteert alleen de velden van AanmeldenRequest. Het record komt uit de GetObjects dataset en bevat
    // ook velden zoals NAAM, onbekende velden geven HTTP 400
    private naarAanmeldenFormaat(record: HeliosAanwezigLedenDataset): HeliosAanmelden {
        const velden: (keyof HeliosAanmelden)[] = ['LID_ID', 'DATUM', 'TIJDSTIP', 'POSITIE', 'VOORAANMELDING', 'AANKOMST',
            'OVERLAND_VLIEGTUIG_ID', 'VOORKEUR_VLIEGTUIG_TYPE', 'VELD_ID', 'OPMERKINGEN'];

        const data = record as Record<string, unknown>;
        return Object.fromEntries(velden.filter(v => data[v] !== undefined).map(v => [v, data[v]])) as HeliosAanmelden;
    }

    // SaveObject accepteert alleen de velden van UpdateOperAanwezigLidDto, onbekende velden uit de dataset geven HTTP 400.
    // AANKOMST en VERTREK komen als "HH:mm:ss" uit GetObjects, Helios.js wil een ISO 8601 datum string
    private naarUpdateFormaat(record: HeliosAanwezigLedenDataset): HeliosAanwezigLidUpdate {
        const velden: (keyof HeliosAanwezigLidUpdate)[] = ['ID', 'DATUM', 'POSITIE', 'LID_ID', 'VOORAANMELDING', 'AANKOMST',
            'VERTREK', 'OVERLAND_VLIEGTUIG_ID', 'VOORKEUR_VLIEGTUIG_TYPE', 'TRANSACTIE_ID', 'VELD_ID', 'OPMERKINGEN'];

        const data = record as Record<string, unknown>;
        const update = Object.fromEntries(velden.filter(v => data[v] !== undefined).map(v => [v, data[v]])) as HeliosAanwezigLidUpdate;
        if (update.AANKOMST !== undefined) update.AANKOMST = naarApiTijd(update.DATUM, update.AANKOMST);
        if (update.VERTREK !== undefined) update.VERTREK = naarApiTijd(update.DATUM, update.VERTREK);
        return update;
    }
}
