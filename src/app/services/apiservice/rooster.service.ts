import {Injectable} from '@angular/core';
import {DateTime} from 'luxon';
import {APIService} from './api.service';
import {HeliosActie, KeyValueArray} from '../../types/Utils';
import {
    HeliosAanwezigLeden,
    HeliosProgressieKaartDataset,
    HeliosRooster,
    HeliosRoosterDag,
    HeliosRoosterDataset
} from '../../types/Helios';
import {BehaviorSubject, Subscription} from "rxjs";
import {SharedService} from "../shared/shared.service";
import {getBeginEindDatumVanMaand} from "../../utils/Utils";
import {debounceTime, delay} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class RoosterService {
    private roosterCache: HeliosRooster = {dataset: []};    // return waarde van API call
    private datumAbonnement: Subscription;                  // volg de keuze van de kalender
    private datum: DateTime;                                // de gekozen dag

    private roosterStore = new BehaviorSubject(this.roosterCache.dataset);
    public readonly roosterChange = this.roosterStore.asObservable();      // nieuw rooster beschikbaar

    constructor(private readonly APIService: APIService,
                private readonly sharedService: SharedService) {

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: 1
            });

            const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

            this.getRooster(beginEindDatum.begindatum, beginEindDatum.einddatum).then((dataset) => {
                if (!this.vulMissendeDagenAan(dataset))
                    this.roosterStore.next(this.roosterCache.dataset)    // afvuren event
            });
        });

        // Als roosterdagen zijn toegevoegd, dan moeten we overzicht opnieuw ophalen
        // een timeout. roosterdagen worden per maand toegevoegd.
        // Niet voor iedere dag meteen opvragen, maar bundelen en 1 keer opvragen
        this.sharedService.heliosEventFired.pipe(debounceTime(500)).subscribe(ev => {
            if (ev.tabel == "Rooster") {
                const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

                this.getRooster(beginEindDatum.begindatum, beginEindDatum.einddatum).then((dataset) => {
                    this.roosterStore.next(this.roosterCache.dataset)    // afvuren event
                });
            }
        });
    }

    async getRooster(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosRoosterDataset[]> {
        let getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        try {
            const response: Response = await this.APIService.get('Rooster/GetObjects', getParams);
            this.roosterCache = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) { // er is geen data
                throw(e);
            }
            return [];
        }
        return this.roosterCache!.dataset as HeliosRoosterDataset[];
    }

    /**
     * Het opgehaalde rooster kan dagen in de maand missen. Deze functie vult alle data aan zodat elke dag in de maand getoond wordt.
     * @private
     * @return {void}
     */
    private vulMissendeDagenAan(roosterDagen: HeliosRoosterDataset[]): boolean {
        const dagenInDeMaand = this.datum.daysInMonth;
        let retValue = false;

        for (let i = 0; i < dagenInDeMaand; i++) {
            const d: DateTime = DateTime.fromObject({month: this.datum.month, year: this.datum.year, day: i + 1});
            const inRooster = roosterDagen.findIndex(roosterDag => roosterDag.DATUM == d.toISODate()) >= 0;

            if (!inRooster) {       // datum staat nog niet in de database, gaan we aanmaken
                const roosterRecord: HeliosRoosterDag = {
                    DATUM: d.toISODate(),
                    DDWV: (d.weekday <= 5 && d.month >= 4 && d.month <= 9),         // DDWV van april t/m sept
                    CLUB_BEDRIJF: (d.weekday > 5 && d.month >= 3 && d.month <= 10)  // Clubdagen van maart t/m oktober
                }
                this.addRoosterdag(roosterRecord);
                retValue = true;
            }
        }
        return retValue;
    }

    async addRoosterdag(roosterDag: HeliosRoosterDag) {
        const response: Response = await this.APIService.post('Rooster/SaveObject', JSON.stringify(roosterDag));
        return response.json();
    }

    async updateRoosterdag(roosterDag: HeliosRoosterDag) {
        const response: Response = await this.APIService.put('Rooster/SaveObject', JSON.stringify(roosterDag));

        return response.json();
    }
}
