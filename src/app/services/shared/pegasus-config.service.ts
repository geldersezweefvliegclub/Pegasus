import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})


export class PegasusConfigService {
    private configURL = '/assets/pegasus.config.json';
    private pegasusConfig: IPegasusConfig;

    public readonly OCHTEND_DDI_TYPE_ID = 1800;
    public readonly OCHTEND_INSTRUCTEUR_TYPE_ID = 1801;
    public readonly OCHTEND_LIERIST_TYPE_ID = 1802;
    public readonly OCHTEND_HULPLIERIST_TYPE_ID = 1803;
    public readonly OCHTEND_STARTLEIDER_TYPE_ID = 1804;
    public readonly OCHTEND_STARTLEIDER_IO_TYPE_ID = 1811;
    public readonly MIDDAG_DDI_TYPE_ID = 1805;
    public readonly MIDDAG_INSTRUCTEUR_TYPE_ID = 1806;
    public readonly MIDDAG_LIERIST_TYPE_ID = 1807;
    public readonly MIDDAG_HULPLIERIST_TYPE_ID = 1808;
    public readonly MIDDAG_STARTLEIDER_TYPE_ID = 1809;
    public readonly MIDDAG_STARTLEIDER_IO_TYPE_ID = 1812;
    public readonly SLEEPVLIEGER_TYPE_ID = 1810;
    public readonly GASTEN_VLIEGER1_TYPE_ID = 1813;
    public readonly GASTEN_VLIEGER2_TYPE_ID = 1814;

    constructor(private http: HttpClient) {
    }

    public load() {

        return new Promise<IPegasusConfig>((resolve, reject) => {
            /*
            fetch(this.configURL).then((response) => {
                this.pegasusConfig = response.json().then(() =>
                    console.log(this.pegasusConfig));
            });
            */

            this.http.get(this.configURL).toPromise().then((response: IPegasusConfig) => {
                this.pegasusConfig = <IPegasusConfig>response;

                resolve(this.pegasusConfig);

            }).catch((response: any) => {
                reject(`Could not load the config file`);
            });
        });


    }

    public getURL(): string {
        return this.pegasusConfig.url;
    }

    public getPVB(): any[] {
        return this.pegasusConfig.pvb;
    }

    public getChecks(): any {
        return this.pegasusConfig.checks;
    }

    public getOverig(): any {
        return this.pegasusConfig.overig;
    }

    public getAirport(): any {
        return this.pegasusConfig.airport;
    }

    public getDienstConfig(): any {
        return this.pegasusConfig.diensten;
    }

    public getVerborgenMenuItems(): string[] {
        return this.pegasusConfig.menuItemsNietTonen;
    }

    public maxZelfDienstenIndelen(): number {
        return (this.pegasusConfig.maxZelfDienstenIndelen) ? this.pegasusConfig.maxZelfDienstenIndelen : 2;
    }

    public maxZelfEditDagen(): number {
        return (this.pegasusConfig.maxZelfEditDagen) ? this.pegasusConfig.maxZelfEditDagen : 14;
    }

    public privacyURL(): string | undefined {
        return this.pegasusConfig.privacy_url;
    }
}


export interface IPegasusConfig {
    url: string;
    privacy_url: string;
    maxZelfDienstenIndelen: number | undefined;
    maxZelfEditDagen: number | undefined;

    menuItemsNietTonen: string[];

    diensten: [
        {
            Tonen: boolean,
            TypeDienst: number,
            ZelfIndelen: boolean,
        }
    ]

    pvb: [{
        Type: string,           // Vliegtuig type
        Lokaal: number,         // Competentie ID voor lokaal vliegen
        Overland: number        // Competentie ID voor overland
    }],

    checks: [{
        Jaren: [number],            // Voor welk jaren zijn de checks
        Check: [{
            Omschrijving: string      // Wat voor een check (checkstart, vragenlijst etc)
            CompetentieID: [number]  // Competentie ID voor jaarcheck voor het jaar XX
        }]
    }],

    overig: [{
        Omschrijving: string,
        CompetentieID: number
    }]

    airport: {
        Latitude: number,
        Longitude: number
    }
}
