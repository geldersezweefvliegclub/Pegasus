import { Injectable } from '@angular/core';
import { ErrorMessage, HeliosActie, KeyValueArray } from '../../types/Utils';
import { SharedService } from '../shared/shared.service';
import { PegasusConfigService } from '../shared/pegasus-config.service';

@Injectable({
    providedIn: 'root'
})
export class APIService {
    private readonly URL:string = 'http://localhost:4200/api/'
    private BearerToken: string | null = null;

    constructor(private readonly sharedService: SharedService,
                private readonly configService: PegasusConfigService) {

        const url = configService.getURL();
        if (url) this.URL = url;
    }

    // opslaan van de token die we met inloggen hebben vekregen
    async setBearerToken(token?: string) {
        this.BearerToken = (token) ? token : null;
    }

    async get(url: string, params?: KeyValueArray, headers?: Headers): Promise<Response> {
        if (params) {
            url = this.prepareEndpoint(url, params);
        }

        const apiHeaders: Headers =  (headers) ? headers : new Headers();
        if (!apiHeaders?.has('Authorization') && this.BearerToken) {
            apiHeaders.append('Authorization', "Bearer " + this.BearerToken);
        }

        const response = await fetch(`${this.URL}${url}`, {
            method: 'GET',
            headers: apiHeaders,
            credentials: 'include'
        });

        if (!response.ok) {
            this.handleError(response);
        }
        return response;
    }

    // Aanroepen post request om het aanmaken van nieuw record
    // Dit is een string voor JSON, of FormData voor foto's
    async post(url: string, body: string|FormData, headers?: Headers): Promise<Response> {
        const apiHeaders: Headers =  (headers) ? headers : new Headers();
        if (!apiHeaders?.has('Authorization') && this.BearerToken) {
            apiHeaders.append('Authorization', "Bearer " + this.BearerToken);
        }
        const response = await fetch(`${this.URL}${url}`, {
            method: 'POST',
            headers: apiHeaders,
            body: body,
            credentials: 'include'
        });
        //todo response heeft een .ok property. Mogelijk beter te gebruiken? (Zoals get())
        if (response.status != 200) {  // 200 is normaal voor post
            this.handleError(response);
        }
        try {
            response.clone().json().then((d) => {
                this.sharedService.fireHeliosEvent({actie: HeliosActie.Add, tabel: url.split('/')[0], data: d});
            });
        }
        catch (e)
        {
            console.error(url, e)
        }


        return response;
    }

    // Aanroepen put request om record te wijzigen
    async put(url: string, body: string, headers?: Headers): Promise<Response> {

        const apiHeaders: Headers =  (headers) ? headers : new Headers();
        if (!apiHeaders?.has('Authorization') && this.BearerToken) {
            apiHeaders.append('Authorization', "Bearer " + this.BearerToken);
        }
        const response = await fetch(`${this.URL}${url}`, {
            method: 'PUT',
            headers: apiHeaders,
            body: body,
            credentials: 'include'
        });
        // todo .ok property gebruiken?
        if (response.status != 200) {  // 200 is normaal voor put
            this.handleError(response);
        }
        response.clone().json().then((d) => {
            this.sharedService.fireHeliosEvent({actie: HeliosActie.Update, tabel: url.split('/')[0], data: d});
        });
        return response;
    }

    // Aanroepen delete request om record te verwijderen
    async delete(url: string, params: KeyValueArray): Promise<void> {
        if (params) {
            url = this.prepareEndpoint(url, params);
        }

        const apiHeaders: Headers = new Headers();
        if (!apiHeaders?.has('Authorization') && this.BearerToken) {
            apiHeaders.append('Authorization', "Bearer " + this.BearerToken);
        }

        const response = await fetch(`${this.URL}${url}`, {
            method: 'DELETE',
            headers: apiHeaders,
            credentials: 'include'
        });
        // todo .ok gebruiken?
        if (response.status != 204) { // 204 is normaal voor delete
            this.handleError(response);
        }
        this.sharedService.fireHeliosEvent({actie: HeliosActie.Delete, tabel: url.split('/')[0], data: params[0]});
    }

    // Aanroepen patch request om verwijderen record ongedaan te maken
    async patch(url: string, params: KeyValueArray): Promise<void> {
        if (params) {
            url = this.prepareEndpoint(url, params);
        }

        const apiHeaders: Headers = new Headers();
        if (!apiHeaders?.has('Authorization') && this.BearerToken) {
            apiHeaders.append('Authorization', "Bearer " + this.BearerToken);
        }

        const response = await fetch(`${this.URL}${url}`, {
            method: 'PATCH',
            headers: apiHeaders,
            credentials: 'include'
        });

        // todo .ok gebruiken?
        if (response.status != 202) { // 204 is normaal voor patch
            this.handleError(response);
        }
        this.sharedService.fireHeliosEvent({actie: HeliosActie.Restore, tabel: url.split('/')[0], data: params[0]});
    }

    private prepareEndpoint(url: string, params: KeyValueArray): string {
        let args = "";

        // Loop vervolgens door het key:value object heen
        // Als het object op index 0 is, voeg vraagteken toe. Als object niet op de laatste plek staat, voeg & toe.
        Object.entries(params).forEach(([key, value]) => {
            if (args == "") {
                args = args.concat('?');
            } else {
                args = args.concat('&');
            }
            args = args.concat(`${key}=${value}`)
        })

        return url + args;
    }


    // Vul customer error  met http status code en de beschrijving uit X-Error-Message
    private handleError(response: Response): ErrorMessage {
        let beschrijving = response.headers.get('X-Error-Message')      // Helios implementaie fout melding
        if (!beschrijving) {
            beschrijving = response.statusText;                         // HTTP error berichten
        }

        const error: ErrorMessage = {
            responseCode: response.status,
            beschrijving: beschrijving
        }

        this.sharedService.fireHeliosFailure(error);
        throw error;
    }
}
