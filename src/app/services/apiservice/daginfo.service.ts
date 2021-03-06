import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {DateTime} from 'luxon';
import {KeyValueArray} from '../../types/Utils';
import {HeliosDagInfo, HeliosDagInfoDagen, HeliosDagInfosDataset, HeliosRoosterDataset} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {SharedService} from '../shared/shared.service';
import {LoginService} from "./login.service";
import {RoosterService} from "./rooster.service";

@Injectable({
    providedIn: 'root'
})
export class DaginfoService {
    private dagInfoTotaalCache: HeliosDagInfoDagen = { dataset: []}; // return waarde van API call
    private dagenCache: HeliosDagInfoDagen = { dataset: []};         // return waarde van API call

    private datumAbonnement: Subscription;         // volg de keuze van de kalender
    private datum: DateTime = DateTime.now();      // de gekozen dag

    public dagInfo: HeliosDagInfo = {};             // hier kunnen de componenten de daginfo ophalen (bijv start invoer)
    private dagInfoStore = new BehaviorSubject(this.dagInfo);
    public readonly dagInfoChange = this.dagInfoStore.asObservable();      // nieuwe dagInfo beschikbaar

    constructor(private readonly APIService: APIService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService,
                private readonly roosterService: RoosterService) {

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            });

            this.getDagInfo(undefined, this.datum).then(di => {
                this.dagInfoStore.next(this.dagInfo)    // afvuren event
            });
        });
    }

    // haal op, op welke dag er daginfo ingevoerd is
    async getDagen(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosDagInfosDataset[]> {
        if (!this.magDagInfoOphalen()) {
            return [];
        }

        let getParams: KeyValueArray = {};
        getParams['BEGIN_DATUM'] = startDatum.toISODate();
        getParams['EIND_DATUM'] = eindDatum.toISODate();
        getParams['VELDEN'] = "ID,DATUM";

        try {
            const response: Response = await this.APIService.get('Daginfo/GetObjects', getParams);

            this.dagenCache = await response.json();

        } catch (e) {
            if (e.responseCode !== 404) {       // er is geen starts
                throw(e);
            }
            return [];
        }
        return this.dagenCache?.dataset as [];
    }


    async getDagInfoDagen(verwijderd: boolean = false, startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueArray = {}): Promise<[]> {
        if (!this.magDagInfoOphalen()) {
            return [];
        }

        let getParams: KeyValueArray = params;

        if ((this.dagInfoTotaalCache != undefined)  && (this.dagInfoTotaalCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
            getParams['HASH'] = this.dagInfoTotaalCache.hash;
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
            this.dagInfoTotaalCache = await response.json();
        } catch (e) {
            if ((e.responseCode !== 304) && (e.responseCode !== 704)) {       // server bevat dezelfde starts als cache
                throw(e);
            }
        }
        return this.dagInfoTotaalCache?.dataset as [];
    }

    // haal de daginfo op van een enkele dag
    async getDagInfo(id: number | undefined, datum: DateTime | undefined): Promise<HeliosDagInfo> {
        if (!this.magDagInfoOphalen()) {
            return {DATUM: this.datum.toISODate()};
        }

        try {
            // we halen de starts op met een ID
            if (id) {
                const response: Response = await this.APIService.get('Daginfo/GetObject', {'ID': id.toString()});
                this.dagInfo = await response.json();
            }

            // we halen de starts op met een datum (hebben geen ID nodig)
            if (datum) {
                const response: Response = await this.APIService.get('Daginfo/GetObject', {'DATUM': datum.toISODate()});
                this.dagInfo = await response.json();
            }
            return this.dagInfo;
        } catch (e) {
            const rooster: HeliosRoosterDataset[] = await this.roosterService.getRooster(this.datum, this.datum);
            this.dagInfo = {
                DATUM: this.datum.toISODate(),
                DDWV: (rooster.length > 0) ? rooster[0].DDWV : false,
                CLUB_BEDRIJF: (rooster.length > 0) ? rooster[0].CLUB_BEDRIJF : false,
                VELD_ID: undefined,
                STARTMETHODE_ID: undefined,
                VLIEGBEDRIJF: "",
                METEO: "",
                INCIDENTEN: "",
                ROLLENDMATERIEEL: "",
                VLIEGENDMATERIEEL: "",
                VERSLAG: "",
                DIENSTEN: ""
            };
            return this.dagInfo;
        }
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
        const replacer = (key:string, value:any) =>
            typeof value === 'undefined' ? null : value;

        const response: Response = await this.APIService.put('Daginfo/SaveObject', JSON.stringify(daginfo, replacer));

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

    // als we weten dat gebruiker geen toegang heeft, hoeven we ook niets op te vragen
    magDagInfoOphalen(): boolean {
        const ui = this.loginService.userInfo?.Userinfo;
        return (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isInstructeur || ui?.isCIMT || ui?.isStarttoren || ui?.isDDWVCrew) ? true : false;
    }
}
