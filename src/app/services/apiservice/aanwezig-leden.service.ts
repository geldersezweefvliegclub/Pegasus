import {Injectable} from '@angular/core';
import {DateTime} from 'luxon';
import {HeliosActie, KeyValueArray} from '../../types/Utils';
import {APIService} from './api.service';
import {HeliosAanwezigLeden, HeliosAanwezigLedenDataset, HeliosAanwezigVliegtuigenDataset} from '../../types/Helios';
import {BehaviorSubject, Subscription} from "rxjs";
import {SharedService} from "../shared/shared.service";
import {debounceTime} from "rxjs/operators";
import {LoginService} from "./login.service";


@Injectable({
    providedIn: 'root'
})
export class AanwezigLedenService {
    private aanwezigCache: HeliosAanwezigLeden = {dataset: []}; // return waarde van API call
    private datumAbonnement: Subscription;                      // volg de keuze van de kalender
    private datum: DateTime = DateTime.now();                   // de gekozen dag

    private overslaan: boolean = false;
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

            // we kunnen alleen data ophalen als we ingelogd zijn
            if (this.loginService.isIngelogd()) {
                this.overslaan = false;     // bij wijzigen datum nooit overslaan
                this.ophalenAanwezig(this.datum, this.datum).then((dataset) => {
                    this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
                });
            }

            // Als we vandaag geselecteerd hebben, halen we iedere 15 min de data van de server
            // Iemand kan zich aangemeld hebben, bijv via de app
            if (this.datum.toISODate() == DateTime.now().toISODate()) {
                this.ophaalTimer = window.setInterval(() => {
                    this.ophalenAanwezig(this.datum,this.datum).then((dataset) => {
                        this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
                    });
                }, 1000 * 60 * 15);
            }
            else {
                clearInterval(this.ophaalTimer);
            }

            // Als start is toegevoegd, dan kan lid aanwezig gemeld worden
            this.sharedService.heliosEventFired.pipe(debounceTime(1000)).subscribe(ev => {
                if (ev.tabel == "Startlijst") {
                    if (ev.actie == HeliosActie.Add) {
                        this.ophalenAanwezig(this.datum, this.datum).then((dataset) => {
                            this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
                        });
                    }
                }

                if (ev.tabel == "AanwezigLeden") {
                    this.ophalenAanwezig(this.datum, this.datum).then((dataset) => {
                        this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
                    });
                }
            });
        });

        // nadat we ingelogd zijn kunnen we de aanwezige leden ophalen
        loginService.inloggenSucces.subscribe(() => {
            this.ophalenAanwezig(this.datum, this.datum).then((dataset) => {
                this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
            });
        });
    }

    private async ophalenAanwezig(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosAanwezigLedenDataset[]> {
        if (this.overslaan) {
            return this.aanwezigCache?.dataset as HeliosAanwezigLedenDataset[];
        }
        this.overslaan = true;
        setTimeout(() => this.overslaan = false, 1000 * 5)
        return await this.getAanwezig(startDatum, eindDatum);
    }

    async updateAanwezigCache(startDatum: DateTime, eindDatum: DateTime) {
        this.ophalenAanwezig(this.datum, this.datum).then((dataset) => {
            this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
        });
    }

    async getAanwezig(startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosAanwezigLedenDataset[]> {
        let getParams: KeyValueArray = params;

        if ((this.aanwezigCache != undefined)  && (this.aanwezigCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.aanwezigCache.hash;
        }
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        getParams['NIET_VERTROKKEN'] = 'true';      // We zijn niet geintresseerd in leden die al vertrokken zijn

        try {
            const response: Response = await this.apiService.get('AanwezigLeden/GetObjects', getParams);
            this.aanwezigCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.aanwezigCache?.dataset as HeliosAanwezigLedenDataset[];
    }

    async getAanwezigLid(id: number): Promise<HeliosAanwezigLedenDataset> {
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
}
