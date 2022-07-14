import {Injectable} from '@angular/core';
import {
    HeliosDienst,
    HeliosDiensten,
    HeliosDienstenDataset,
    HeliosDienstenTotaal,
    HeliosTracksDataset
} from "../../types/Helios";
import {APIService} from "./api.service";
import {KeyValueArray} from "../../types/Utils";
import {DateTime} from "luxon";
import {BehaviorSubject, Subscription} from "rxjs";
import {SharedService} from "../shared/shared.service";
import {getBeginEindDatumVanMaand} from "../../utils/Utils";
import {debounceTime} from "rxjs/operators";
import {LoginService} from "./login.service";

@Injectable({
    providedIn: 'root'
})

export class DienstenService {
    private dienstenCache: HeliosDiensten = { dataset: []};     // return waarde van API call
    private totalenCache: HeliosDienstenTotaal[] = [];          // return waarde van API call

    private datumAbonnement: Subscription;                     // volg de keuze van de kalender
    private datum: DateTime = DateTime.now();                  // de gekozen dag

    private dienstenStore = new BehaviorSubject(this.dienstenCache.dataset);
    public readonly dienstenChange = this.dienstenStore.asObservable();      // nieuw rooster beschikbaar

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

            // we kunnen alleen starts ophalen als we ingelogd zijn, en starttoren heeft niets nodig
            if (this.loginService.isIngelogd() && (!this.loginService.userInfo?.Userinfo!.isStarttoren)) {
                const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

                this.getDiensten(beginEindDatum.begindatum, beginEindDatum.einddatum).then((dataset) => {
                    this.dienstenStore.next(this.dienstenCache.dataset)    // afvuren event
                });
            }
        });

        // Als diensten zijn toegevoegd, dan moeten we overzicht opnieuw ophalen
        // Niet meteen opvragen, maar bundelen en 1 keer opvragen
        this.sharedService.heliosEventFired.pipe(debounceTime(500)).subscribe(ev => {
            if (ev.tabel == "Diensten") {
                const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

                this.getDiensten(beginEindDatum.begindatum, beginEindDatum.einddatum).then((dataset) => {
                    this.dienstenStore.next(this.dienstenCache.dataset)    // afvuren event
                });
            }
        });

        // nadat we ingelogd zijn kunnen we de diensten ophalen, starttoren heeft niets nodig
        if ((!this.loginService.userInfo?.Userinfo!.isStarttoren)) {
            loginService.inloggenSucces.subscribe(() => {
                const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

                this.getDiensten(beginEindDatum.begindatum, beginEindDatum.einddatum).then((dataset) => {
                    this.dienstenStore.next(this.dienstenCache.dataset)    // afvuren event
                });
            });
        }
    }

    async getDiensten(startDatum: DateTime, eindDatum: DateTime, dienstType?: number, lidID?: number): Promise<HeliosDienstenDataset[]> {
        let getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if ((this.dienstenCache != undefined)  && (this.dienstenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.dienstenCache.hash;
        }
        if (lidID != undefined) {
            getParams['LID_ID'] = lidID.toString();
        }
        if (dienstType != undefined) {
            getParams['TYPES'] = dienstType.toString();
        }

        try {
            const response: Response = await this.apiService.get('Diensten/GetObjects', getParams);
            this.dienstenCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.dienstenCache?.dataset as HeliosTracksDataset[];
    }


    async getTotalen(jaar: number, lidID?: number): Promise<HeliosDienstenTotaal[]> {
        let getParams: KeyValueArray = {};
        getParams['JAAR'] = jaar.toString();

        if (lidID) {
            getParams['LID_ID'] = lidID.toString();
        }

        try {
            const response: Response = await this.apiService.get('Diensten/TotaalDiensten', getParams);

            this.totalenCache = await response.json();
            return this.totalenCache;

        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return [];
    }

    async addDienst(dienst: HeliosDienst) {
        const response: Response = await this.apiService.post('Diensten/SaveObject', JSON.stringify(dienst));
        return response.json();
    }

    async updateDienst(dienst: HeliosDienst) {
        const replacer = (key:string, value:any) =>
            typeof value === 'undefined' ? null : value;

        dienst.ROOSTER_ID = undefined;
        dienst.INGEVOERD_DOOR_ID = undefined;
        const response: Response = await this.apiService.put('Diensten/SaveObject', JSON.stringify(dienst, replacer));

        return response.json();
    }

    async deleteDienst(id: number) {
        await this.apiService.delete('Diensten/DeleteObject', {'ID': id.toString()});
    }

    async restoreDienst(id: number) {
        await this.apiService.patch('Diensten/RestoreObject', {'ID': id.toString()});
    }
}
