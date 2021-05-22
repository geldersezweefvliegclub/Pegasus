import {Injectable} from '@angular/core';
import {KeyValueString} from '../../types/Utils';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class APIService {

  async post(): Promise<unknown> {
    throw Error('Post not implemented');
  }

  async put(): Promise<unknown> {
    throw Error('Put not implemented');
  }

  async get(url: string, headers?: Headers, params?: KeyValueString[]): Promise<Response> {
    if (params) {
      url = this.prepareEndpoint(url, params);
    }

    return fetch(`${environment.helios}${url}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
  }

  private prepareEndpoint(url: string, params: KeyValueString[]): string {
    // Loop door de array met parameters
    for (let index = 0; index < params.length; index++) {
      const param = params[index];

      // Loop vervolgens door het key:value object heen
      // Als het object op index 0 is, voeg vraagteken toe. Als object niet op de laatste plek staat, voeg & toe.
      Object.entries(param).forEach(([key, value]) => {
        url += (url == null) ? '?' : '&';
        url = url.concat(`${key}=${value}`);
      });
    }

    return url
  }
}
