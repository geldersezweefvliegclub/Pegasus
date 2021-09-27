import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {DateTime} from 'luxon';
import {KeyValueArray} from '../../types/Utils';
import {HeliosCompetentiesDataset, HeliosDagInfo, HeliosDagInfoDagen, HeliosDagInfosDataset} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {BehaviorSubject, Subscription} from 'rxjs';
import {SharedService} from '../shared/shared.service';
import {LoginService} from "./login.service";

@Injectable({
    providedIn: 'root'
})
export class DaginfoService {
    private dagInfoTotaal: HeliosDagInfoDagen = { dataset: []};
    private vorigVerzoekTotaal: string = '';         // parameters van vorige call

    private dagen: HeliosDagInfoDagen = { dataset: []};
    private vorigVerzoekDagen: string = '';         // parameters van vorige call

    public dagInfo: HeliosDagInfo = {};             // hier kunnen de componenten de daginfo ophalen (bijv start invoer)
    private vorigDagInfo: string = '';              // parameters van vorige call

    private datumAbonnement: Subscription;         // volg de keuze van de kalender
    private datum: DateTime;                       // de gekozen dag

    private dagInfoStore = new BehaviorSubject(this.dagInfo);
    public readonly dagInfoChange = this.dagInfoStore.asObservable();      // nieuwe dagInfo beschikbaar

    constructor(private readonly APIService: APIService,
                private readonly loginService: LoginService,
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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekDagen) {
            return this.dagen?.dataset as HeliosDagInfosDataset[];
        }
        else
        {
            this.vorigVerzoekDagen = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekDagen = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

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

        if (!this.magDagInfoOphalen()) {
            return [];
        }

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

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify(getParams) == this.vorigVerzoekTotaal) {
            return this.dagInfoTotaal?.dataset as [];
        }
        else
        {
            this.vorigVerzoekTotaal = JSON.stringify(getParams);
            setTimeout(() => this.vorigVerzoekTotaal = '', 5000);     // over 5 seconden mogen we weer API aanroepen
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
        if (!this.magDagInfoOphalen()) {
            return {DATUM: this.datum.toISODate()};
        }

        // we hebben nu dezelfde call als de vorige call, geven opgeslagen resultaat terug en roepen de api niet aan.
        if (JSON.stringify({ID: id, DATUM: datum}) == this.vorigDagInfo) {
            return this.dagInfo;
        }
        else
        {
            this.vorigDagInfo = JSON.stringify({ID: id, DATUM: datum});
            setTimeout(() => this.vorigDagInfo = '', 5000);     // over 5 seconden mogen we weer API aanroepen
        }

        try {
            // we halen de data op met een ID
            if (id) {
                const response: Response = await this.APIService.get('Daginfo/GetObject', {'ID': id.toString()});
                this.dagInfo = await response.json();
            }

            // we halen de data op met een datum (hebben geen ID nodig)
            if (datum) {
                const response: Response = await this.APIService.get('Daginfo/GetObject', {'DATUM': datum.toISODate()});
                this.dagInfo = await response.json();
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

    // als we weten dat gebruiker geen toegang heeft, hoeven we ook niets op te vragen
    magDagInfoOphalen(): boolean {
        const ui = this.loginService.userInfo?.Userinfo;
        if (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isInstructeur || ui?.isCIMT || ui?.isStarttoren || ui?.isDDWVCrew) {
            return true;
        }
        return false;
    }
}
