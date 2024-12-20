import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { APIService } from './api.service';
import { KeyValueArray } from '../../types/Utils';
import { HeliosRooster, HeliosRoosterDag, HeliosRoosterDataset } from '../../types/Helios';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SharedService } from '../shared/shared.service';
import { CustomJsonSerializer, getBeginEindDatumVanMaand } from '../../utils/Utils';
import { LoginService } from './login.service';
import { debounceTime } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class RoosterService {
    private roosterCache: HeliosRooster = {dataset: []};    // return waarde van API call
    private datumAbonnement: Subscription;                  // volg de keuze van de kalender
    private datum: DateTime = DateTime.now();               // de gekozen dag

    private roosterStore = new BehaviorSubject(this.roosterCache.dataset);
    public readonly roosterChange = this.roosterStore.asObservable();      // nieuw rooster beschikbaar

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: 1
            });

            // we kunnen alleen rooster ophalen als we ingelogd zijn, en starttoren heeft niets nodig
            if (this.loginService.isIngelogd()) {
                const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

                this.getRooster(beginEindDatum.begindatum, beginEindDatum.einddatum).then((dataset) => {
                    if (!this.vulMissendeDagenAan(dataset))
                        this.roosterStore.next(this.roosterCache.dataset)    // afvuren event
                });
            }
        });

        // Als roosterdagen zijn toegevoegd, dan moeten we overzicht opnieuw ophalen
        // een timeout. roosterdagen worden per maand toegevoegd.
        // Niet voor iedere dag meteen opvragen, maar bundelen en 1 keer opvragen
        this.sharedService.heliosEventFired.pipe(debounceTime(1500)).subscribe(ev => {
            if (ev.tabel == "Rooster") {
                const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

                this.getRooster(beginEindDatum.begindatum, beginEindDatum.einddatum).then(() => {
                    this.roosterStore.next(this.roosterCache.dataset)    // afvuren event
                });
            }
        });

        // nadat we ingelogd zijn kunnen we de rooster ophalen, starttoren heeft niets nodig
        if ((!this.loginService.userInfo?.Userinfo!.isStarttoren)) {
            loginService.inloggenSucces.subscribe(() => {
                const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

                this.getRooster(beginEindDatum.begindatum, beginEindDatum.einddatum).then((dataset) => {
                    if (!this.vulMissendeDagenAan(dataset))
                        this.roosterStore.next(this.roosterCache.dataset)    // afvuren event
                });
            });
        }
    }

    async getRooster(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosRoosterDataset[]> {
        const getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.roosterCache != undefined)  && (this.roosterCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.roosterCache.hash;
        }

        try {
            const response: Response = await this.apiService.get('Rooster/GetObjects', getParams);
            this.roosterCache = await response.json();

        } catch (e) {

            if (e.responseCode === 404) { // er is geen starts
                return [];
            }

            if ((e.responseCode !== 304) && (e.responseCode !== 704)) {  // er is geen nieuwe starts
                throw(e);
            }
        }
        return this.roosterCache!.dataset as HeliosRoosterDataset[];
    }

    /**
     * Het opgehaalde rooster kan dagen in de maand missen. Deze functie vult alle starts aan zodat elke dag in de maand getoond wordt.
     * @private
     * @return {void}
     */
    private vulMissendeDagenAan(roosterDagen: HeliosRoosterDataset[]): boolean {
        const dagenInDeMaand = this.datum.daysInMonth ?? 0;
        let retValue = false;

        const nu: DateTime = DateTime.now();

        // als maand in het verleden is, gaan we niets doen
        if (this.datum.year*100 + this.datum.month < nu.year*100+nu.month) {
            return false;
        }

        for (let i = 0; i < dagenInDeMaand; i++) {
            const d: DateTime = DateTime.fromObject({month: this.datum.month, year: this.datum.year, day: i + 1});
            const inRooster = roosterDagen.findIndex(roosterDag => roosterDag.DATUM == d.toISODate()) >= 0;

            if (!inRooster) {       // datum staat nog niet in de database, gaan we aanmaken
                const roosterRecord: HeliosRoosterDag = {
                    DATUM: d.toISODate() as string,
                }
                this.addRoosterdag(roosterRecord);
                retValue = true;
            }
        }
        return retValue;
    }

    async addRoosterdag(roosterDag: HeliosRoosterDag) {
        const response: Response = await this.apiService.post('Rooster/SaveObject', JSON.stringify(roosterDag));
        return response.json();
    }

    async updateRoosterdag(roosterDag: HeliosRoosterDag) {
        const response: Response = await this.apiService.put('Rooster/SaveObject', JSON.stringify(roosterDag, CustomJsonSerializer));

        return response.json();
    }
}
