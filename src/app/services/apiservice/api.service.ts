import {Injectable} from '@angular/core';
import {CustomError, HeliosActie, KeyValueString} from '../../types/Utils';
import {environment} from '../../../environments/environment';
import {SharedService} from '../shared/shared.service';
import {PegasusConfigService} from "../shared/pegasus-config.service";
import {Base64} from "js-base64";
import {Form} from '@angular/forms';

@Injectable({
    providedIn: 'root'
})
export class APIService {
    private readonly URL:string = 'http://localhost:4200/api/'

    constructor(private readonly sharedService: SharedService,
                private readonly configService: PegasusConfigService) {

        const url = configService.getURL();
        if (url) this.URL = url;
    }

    async get(url: string, params?: KeyValueString, headers?: Headers): Promise<Response> {
        if (params) {
            url = this.prepareEndpoint(url, params);
        }


        const response = await fetch(`${this.URL}${url}`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        });

        if (!response.ok) {
            throw this.handleError(response);
        }
        return response;
    }

    // Aanroepen post request om het aanmaken van nieuw record
    // Dit is een string voor JSON, of FormData voor foto's
    async post(url: string, body: string|FormData): Promise<Response> {

        const response = await fetch(`${this.URL}${url}`, {
            method: 'POST',
            body: body,
        });
        //todo response heeft een .ok property. Mogelijk beter te gebruiken? (Zoals get())
        if (response.status != 200) {  // 200 is normaal voor post
            throw this.handleError(response);
        }
        response.clone().json().then((d) => {
            this.sharedService.fireHeliosEvent({actie: HeliosActie.Add, tabel: url.split('/')[0], data: d});
        });

        return response;
    }

    // Aanroepen put request om record te wijzigen
    async put(url: string, body: string): Promise<Response> {

        const response = await fetch(`${this.URL}${url}`, {
            method: 'PUT',
            body: body,
        });
        // todo .ok property gebruiken?
        if (response.status != 200) {  // 200 is normaal voor put
            throw this.handleError(response);
        }
        response.clone().json().then((d) => {
            this.sharedService.fireHeliosEvent({actie: HeliosActie.Update, tabel: url.split('/')[0], data: d});
        });
        return response;
    }

    // Aanroepen delete request om record te verwijderen
    async delete(url: string, params: KeyValueString): Promise<void> {
        if (params) {
            url = this.prepareEndpoint(url, params);
        }

        const response = await fetch(`${this.URL}${url}`, {
            method: 'DELETE',
        });
        // todo .ok gebruiken?
        if (response.status != 204) { // 204 is normaal voor delete
            throw this.handleError(response);
        }
        this.sharedService.fireHeliosEvent({actie: HeliosActie.Delete, tabel: url.split('/')[0], data: params[0]});
    }

    // Aanroepen patch request om verwijderen record ongedaan te maken
    async patch(url: string, params: KeyValueString): Promise<void> {
        if (params) {
            url = this.prepareEndpoint(url, params);
        }

        const response = await fetch(`${this.URL}${url}`, {
            method: 'PATCH',
        });

        // todo .ok gebruiken?
        if (response.status != 202) { // 204 is normaal voor patch
            throw this.handleError(response);
        }
        this.sharedService.fireHeliosEvent({actie: HeliosActie.Restore, tabel: url.split('/')[0], data: params[0]});
    }

    private prepareEndpoint(url: string, params: KeyValueString): string {
        let args: string = "";

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
    private handleError(response: Response): CustomError {
        const error: CustomError = {
            responseCode: response.status,
            beschrijving: response.headers.get('X-Error-Message')
        }
        //todo mogelijk kan error hier al gethrowed worden ipv error obj returnen
        return error;
    }
}
