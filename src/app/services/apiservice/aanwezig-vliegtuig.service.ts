import {Injectable} from '@angular/core';
import {StorageService} from '../storage/storage.service';
import {DateTime} from 'luxon';
import {HeliosActie, KeyValueArray} from '../../types/Utils';
import {APIService} from './api.service';
import {HeliosAanwezigVliegtuigen, HeliosAanwezigVliegtuigenDataset} from '../../types/Helios';
import {BehaviorSubject, Subscription} from "rxjs";
import {SharedService} from "../shared/shared.service";


@Injectable({
    providedIn: 'root'
})
export class AanwezigVliegtuigService {
    private aanwezigCache: HeliosAanwezigVliegtuigen = { dataset: []};   // return waarde van API call

    private datumAbonnement: Subscription;                      // volg de keuze van de kalender
    private datum: DateTime;                                    // de gekozen dag

    private ophaalTimer: number;                                // Iedere 15 min halen we de aanwezige vliegtuigen op
    private aanwezigStore = new BehaviorSubject(this.aanwezigCache.dataset);
    public readonly aanwezigChange = this.aanwezigStore.asObservable();      // nieuwe aanwezigheid beschikbaar

    constructor(private readonly APIService: APIService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService) {

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            });

            this.getAanwezig(this.datum,this.datum).then((dataset) => {
                this.aanwezigStore.next(this.aanwezigCache.dataset!)    // afvuren event
            });

            // Als we vandaag geselecteerd hebben, halen we iedere 15 min de data van de server
            // Iemand kan een vliegtuig aangemeld hebben, bijv via de app
            if (this.datum.toISODate() == DateTime.now().toISODate()) {
                this.ophaalTimer = window.setInterval(() => {
                    this.getAanwezig(this.datum,this.datum).then((dataset) => {
                        this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
                    });
                }, 1000 * 60 * 15);
            }
            else {
                clearInterval(this.ophaalTimer);
            }

            // Als start is toegevoegd, dan kan vliegtuig aanwezig gemeld worden
            this.sharedService.heliosEventFired.subscribe(ev => {
                if (ev.tabel == "Startlijst") {
                    if (ev.actie == HeliosActie.Add) {
                        this.getAanwezig(this.datum, this.datum).then((dataset) => {
                            this.aanwezigStore.next(this.aanwezigCache.dataset)    // afvuren event
                        });
                    }
                }
            });
        });
    }

    async getAanwezig(startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise<HeliosAanwezigVliegtuigenDataset[]> {
        let hash: string = '';

        if (((this.aanwezigCache == null)) && (this.storageService.ophalen('aanwezigVliegtuigen') != null)) {
            this.aanwezigCache = this.storageService.ophalen('aanwezigVliegtuigen');
        }

        let getParams: KeyValueArray = params;

        if (this.aanwezigCache != null) { // we hebben eerder de lijst opgehaald
            hash = this.aanwezigCache.hash as string;
//      getParams['HASH'] = hash;
        }

        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }


        try {
            const response: Response = await this.APIService.get('AanwezigVliegtuigen/GetObjects', getParams);

            this.aanwezigCache = await response.json();
            this.storageService.opslaan('aanwezigVliegtuigen', this.aanwezigCache);
        } catch (e) {
            if (e.responseCode !== 304) { // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.aanwezigCache?.dataset as HeliosAanwezigVliegtuigenDataset[];
    }
}
