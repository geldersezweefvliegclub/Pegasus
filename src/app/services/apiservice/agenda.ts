import {Injectable} from '@angular/core';
import {DateTime} from 'luxon';
import {APIService} from './api.service';
import {KeyValueArray} from '../../types/Utils';
import {
    HeliosAgendaDataset,
    HeliosAgendas,
    HeliosRooster,
    HeliosRoosterDag,
    HeliosRoosterDataset
} from '../../types/Helios';
import {BehaviorSubject, Subscription} from "rxjs";
import {SharedService} from "../shared/shared.service";
import {getBeginEindDatumVanMaand} from "../../utils/Utils";
import {LoginService} from "./login.service";
import {debounceTime} from "rxjs/operators";
import * as inspector from "inspector";

@Injectable({
    providedIn: 'root'
})
export class AgendaService {
    private agendaCache: HeliosAgendas = {dataset: []};    // return waarde van API call
    private datumAbonnement: Subscription;                  // volg de keuze van de kalender

    constructor(private readonly apiService: APIService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {}

    async getAgenda(startDatum: DateTime, eindDatum: DateTime, max?: number): Promise<HeliosAgendaDataset[]> {
        let getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate() as string;
        getParams['EIND_DATUM'] = eindDatum.toISODate() as string;
        if (max) {
            getParams['MAX'] = max;
        }

        // kunnen alleen data ophalen als we ingelogd zijn
        if (!this.loginService.isIngelogd()) {
            return [];
        }

        if ((this.agendaCache != undefined)  && (this.agendaCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.agendaCache.hash;
        }

        try {
            const response: Response = await this.apiService.get('Agenda/GetObjects', getParams);
            this.agendaCache = await response.json();

        } catch (e) {

            if (e.responseCode === 404) { // er is geen starts
                return [];
            }

            if ((e.responseCode !== 304) && (e.responseCode !== 704)) {  // er is geen nieuwe starts
                throw(e);
            }
        }
        return this.agendaCache!.dataset as HeliosRoosterDataset[];
    }
}
