import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})


export class PegasusConfigService {
    private configURL = '/assets/pegasus.config.json';
    private pegasusConfig: IPegasusConfig;

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
}

export interface IPegasusConfig {
    url: string;
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
