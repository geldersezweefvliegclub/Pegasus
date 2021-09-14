import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {DateTime} from 'luxon';
import {KeyValueArray} from '../../types/Utils';
import {HeliosDagInfo, HeliosDagInfoDagen, HeliosDagInfosDataset} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {SharedService} from '../shared/shared.service';

@Injectable({
    providedIn: 'root'
})
export class DaginfoService {
    private dagInfoTotaal: HeliosDagInfoDagen | null = null;
    private dagen: HeliosDagInfoDagen | null = null;
    public dagInfo: HeliosDagInfo = {};             // hier kunnen de componenten de daginfo ophalen (bijv start invoer)

    private datumAbonnement: Subscription;         // volg de keuze van de kalender
    private datum: DateTime;                       // de gekozen dag

    private dagInfoStore = new BehaviorSubject(this.dagInfo);
    public readonly dagInfoChange = this.dagInfoStore.asObservable();      // nieuwe dagInfo beschikbaar

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

            this.getDagInfo(undefined, this.datum).then(di => {
                this.dagInfo = di;
                this.dagInfoStore.next(this.dagInfo)    // afvuren event
            });
        });
    }

    // haal op, op welke dag er daginfo ingevoerd is
    async getDagen(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosDagInfosDataset[]> {
        interface parameters {
            [key: string]: string;
        }

        let getParams: parameters = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();
        getParams['VELDEN'] = "ID,DATUM";

        try {
            const response: Response = await this.APIService.get('Daginfo/GetObjects', getParams);

            this.dagen = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) {       // er is geen data
                throw(e);
            }
            return [];
        }
        return this.dagen?.dataset as [];
    }


    async getDagInfoDagen(verwijderd: boolean = false, startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise<[]> {
        let hash: string = '';

        if (((this.dagInfoTotaal == null)) && (this.storageService.ophalen('daginfo') != null)) {
            this.dagInfoTotaal = this.storageService.ophalen('daginfo');
        }

        let getParams: KeyValueArray = params;

        if (this.dagInfoTotaal != null) {           // we hebben eerder de lijst opgehaald
            hash = this.dagInfoTotaal.hash as string;
//            getParams['HASH'] = hash;
        }

        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();

        if (zoekString) {
            getParams['SELECTIE'] = zoekString;
        }

        if (verwijderd) {
            getParams['VERWIJDERD'] = "true";
        }

        try {
            const response: Response = await this.APIService.get('Daginfo/GetObjects', getParams);

            this.dagInfoTotaal = await response.json();
            this.storageService.opslaan('starts', this.dagInfoTotaal);
        } catch (e) {
            if (e.responseCode !== 304) {       // server bevat dezelfde data als cache
                throw(e);
            }
        }
        return this.dagInfoTotaal?.dataset as [];
    }

    // haal de daginfo op van een enkele dag
    async getDagInfo(id: number | undefined, datum: DateTime | undefined): Promise<HeliosDagInfo> {
        try {
            // we halen de data op met een ID
            if (id) {
                const response: Response = await this.APIService.get('Daginfo/GetObject', {'ID': id.toString()});
                return response.json();
            }

            // we halen de data op met een datum (hebben geen ID nodig)
            if (datum) {
                const response: Response = await this.APIService.get('Daginfo/GetObject', {'DATUM': datum.toISODate()});
                return response.json();
            }
        } catch (e) {
            return {DATUM: this.datum.toISODate()};
        }
        console.error("Onjuiste aanroep getDagInfo()");
        return {DATUM: this.datum.toISODate()};  // dit mag nooit
    }

    // opslaan van een nieuw daginfo record
    async addDagInfo(daginfo: HeliosDagInfo) {
        const response: Response = await this.APIService.post('Daginfo/SaveObject', JSON.stringify(daginfo));

        // opslaan als class variable en fire event
        response.clone().json().then((di) => {
            this.dagInfo = di;
            this.dagInfoStore.next(this.dagInfo)
        });
        return response.json();
    }

    // update een bestaand daginfo record
    async updateDagInfo(daginfo: HeliosDagInfo) {
        const response: Response = await this.APIService.put('Daginfo/SaveObject', JSON.stringify(daginfo));

        // opslaan als class variable en fire event
        response.clone().json().then((di) => {
            this.dagInfo = di;
            this.dagInfoStore.next(this.dagInfo)
        });
        return response.json();
    }

    // deze dag kan verwijderd worden
    async deleteDagInfo(id: number) {
        await this.APIService.delete('Daginfo/DeleteObject', {'ID': id.toString()});
    }

    // haal een verwijderd record terug
    async restoreDagInfo(id: number) {
        await this.APIService.patch('Daginfo/RestoreObject', {'ID': id.toString()});
    }
}
