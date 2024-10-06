import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Airport, Check, Dienst, IPegasusConfig, MenuItem, Overig, PVB, Rapport } from '../../types/IPegasusConfig';

@Injectable({
    providedIn: 'root'
})
export class PegasusConfigService {
    private configURL = './assets/pegasus.config.json';
    private pegasusConfig: IPegasusConfig;

    public readonly OCHTEND_DDI_TYPE_ID: number = 1800;
    public readonly OCHTEND_INSTRUCTEUR_TYPE_ID: number = 1801;
    public readonly OCHTEND_LIERIST_TYPE_ID: number = 1802;
    public readonly OCHTEND_HULPLIERIST_TYPE_ID: number = 1803;
    public readonly OCHTEND_STARTLEIDER_TYPE_ID: number = 1804;
    public readonly OCHTEND_STARTLEIDER_IO_TYPE_ID: number = 1811;
    public readonly MIDDAG_DDI_TYPE_ID: number = 1805;
    public readonly MIDDAG_INSTRUCTEUR_TYPE_ID: number = 1806;
    public readonly MIDDAG_LIERIST_TYPE_ID: number = 1807;
    public readonly MIDDAG_HULPLIERIST_TYPE_ID: number = 1808;
    public readonly MIDDAG_STARTLEIDER_TYPE_ID: number = 1809;
    public readonly MIDDAG_STARTLEIDER_IO_TYPE_ID: number = 1812;
    public readonly SLEEPVLIEGER_TYPE_ID: number = 1810;
    public readonly GASTEN_VLIEGER1_TYPE_ID: number = 1813;
    public readonly GASTEN_VLIEGER2_TYPE_ID: number = 1814;


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
                this.pegasusConfig = response as IPegasusConfig;

                resolve(this.pegasusConfig);
            }).catch(() => {
                reject(`Could not load the config file`);
            });
        });
    }

    public getURL(): string {
        return this.pegasusConfig.url;
    }

    public getFlarmURL(): string {
        return this.pegasusConfig.flarm_url;
    }

    public getPVB(): PVB[] {
        return this.pegasusConfig.pvb;
    }

    public getChecks(): { Jaren: number[], Check: Check[] } {
        return this.pegasusConfig.checks;
    }

    public getOverig(): Overig[] {
        return this.pegasusConfig.overig;
    }

    public getAirport(): Airport {
        return this.pegasusConfig.airport;
    }

    public getDienstConfig(): Dienst[] {
        return this.pegasusConfig.diensten;
    }

    public getVerborgenMenuItems(): string[] {
        return this.pegasusConfig.menuItemsNietTonen;
    }

    public maxZelfDienstenIndelen(): number {
        return this.pegasusConfig.maxZelfDienstenIndelen ?? 2;
    }

    public maxZelfEditDagen(): number {
        return this.pegasusConfig.maxZelfEditDagen ?? 14;
    }

    public privacyURL(): string {
        return this.pegasusConfig.privacy_url;
    }

    public saldoActief(): boolean {
        return this.pegasusConfig.saldo_actief;
    }

    public getRapporten(): Rapport[] {
        return this.pegasusConfig.rapporten;
    }

    public menuItems(): MenuItem[] {
        return this.pegasusConfig.menuItems;
    }
}
