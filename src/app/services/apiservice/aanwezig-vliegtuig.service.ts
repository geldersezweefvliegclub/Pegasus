import {Injectable} from '@angular/core';
import {DateTime} from 'luxon';
import {HeliosActie, KeyValueArray} from '../../types/Utils';
import {APIService} from './api.service';
import {HeliosAanwezigVliegtuigen, HeliosAanwezigVliegtuigenDataset} from '../../types/Helios';
import {BehaviorSubject, Subscription} from "rxjs";
import {SharedService} from "../shared/shared.service";
import {debounceTime} from "rxjs/operators";
import {LoginService} from "./login.service";


@Injectable({
    providedIn: 'root'
})
export class AanwezigVliegtuigService {
    private aanwezigCache: HeliosAanwezigVliegtuigen = { dataset: []};   // return waarde van API call

    private datumAbonnement: Subscription;                      // volg de keuze van de kalender
    private datum: DateTime = DateTime.now();                   // de gekozen dag

    private overslaan: boolean = false;
    private ophaalTimer: number;                                // Iedere 15 min halen we de aanwezige vliegtuigen op
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
                    this.aanwezigStore.next(this.aanwezigCache.dataset!)    // afvuren event
                });
            }

            // Als we vandaag geselecteerd hebben, halen we iedere 15 min de data van de server
            // Iemand kan een vliegtuig aangemeld hebben, bijv via de app
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

            // Als start is toegevoegd, dan kan vliegtuig aanwezig gemeld worden
            this.sharedService.heliosEventFired.pipe(debounceTime(1000)).subscribe(ev => {
                if (ev.tabel == "Startlijst") {
                    if (ev.actie == HeliosActie.Add) {
                        this.ophalenAanwezig(this.datum, this.datum).then((dataset) => {
                            this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
                        });
                    }
                }

                if (ev.tabel == "AanwezigVliegtuigen") {
                    this.ophalenAanwezig(this.datum, this.datum).then((dataset) => {
                        this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
                    });
                }
            });
        });

        // nadat we ingelogd zijn kunnen we de aanwezige vliegtuigen ophalen
        loginService.inloggenSucces.subscribe(() => {
            this.ophalenAanwezig(this.datum, this.datum).then((dataset) => {
                this.aanwezigStore.next(this.aanwezigCache.dataset!)    // afvuren event
            });
        });
    }

    private async ophalenAanwezig(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosAanwezigVliegtuigenDataset[]> {
        if (this.overslaan) {
            return this.aanwezigCache?.dataset as HeliosAanwezigVliegtuigenDataset[];
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

    async getAanwezig(startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosAanwezigVliegtuigenDataset[]> {
        let getParams: KeyValueArray = params;

        if ((this.aanwezigCache != undefined)  && (this.aanwezigCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.aanwezigCache.hash;
        }
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        getParams['NIET_VERTROKKEN'] = 'true';      // We zijn niet geintresseerd in vliegtuigen die al vertrokken zijn
        try {
            const response: Response = await this.apiService.get('AanwezigVliegtuigen/GetObjects', getParams);
            this.aanwezigCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        if (this.aanwezigCache?.dataset) {
            this.aanwezigCache?.dataset.sort(function compareFn(a, b) {

                const volgordeA = (a.VOLGORDE) ? a.VOLGORDE : 1000;
                const volgordeB = (b.VOLGORDE) ? b.VOLGORDE : 1000;

                if ((volgordeA - volgordeB) != 0) {
                    return volgordeA - volgordeB;
                }
                return a.REG_CALL!.localeCompare(b.REG_CALL!);
            });
        }
        return this.aanwezigCache?.dataset as HeliosAanwezigVliegtuigenDataset[];
    }

    async aanmelden(datum: DateTime, vliegtuigID: number): Promise<any> {
        const record = {
            VLIEGTUIG_ID: vliegtuigID,
            DATUM: datum.year + "-" + datum.month + "-" + datum.day
        }
        const response: Response = await this.apiService.post('AanwezigVliegtuigen/Aanmelden', JSON.stringify(record));
        return response.json();
    }

    async aanmeldingVerwijderen(id: number) {
        await this.apiService.delete('AanwezigVliegtuigen/DeleteObject', {'ID': id.toString()});
    }

    async afmelden(vliegtuigID: number): Promise<any> {
        const response: Response = await this.apiService.post('AanwezigVliegtuigen/Afmelden', JSON.stringify({ VLIEGTUIG_ID: vliegtuigID }));
        return response.json();
    }
}
