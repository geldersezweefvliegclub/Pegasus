import {Injectable} from '@angular/core';
import {KeyValueString, CustomError} from '../../types/Utils';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class APIService {
  private URL = 'http://localhost:4200/api/'

  async post(): Promise<unknown> {
    throw Error('Post not implemented')
  }

  async put(): Promise<unknown> {
    throw Error('Put not implemented')
  }

  async get(url: string, headers?: Headers, params?: KeyValueString[]): Promise<Response> {
    if (params) {
      url = this.prepareEndpoint(url, params);
    }

    const response = await fetch(`${environment.helios}${url}`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      throw this.handleError(response);
    }
    return response;
  }

  private prepareEndpoint(url: string, params: KeyValueString[]): string {
    // Loop door de array met parameters
    for (let index = 0; index < params.length; index++) {
      const param = params[index]

      // Loop vervolgens door het key:value object heen
      // Als het object op index 0 is, voeg vraagteken toe. Als object niet op de laatste plek staat, voeg & toe.
      Object.entries(param).forEach(([key, value]) => {
        if (index == 0) url = url.concat('?')
        url = url.concat(`${key}=${value}`)
        if (index != params.length - 1) url = url.concat('&')
      })
    }

    return url;
  }

  // Vul customer error  met http status code en de beschrijving uit X-Error-Messag
  private handleError(response: Response): CustomError {
    const error: CustomError = { responseCode: response.status, beschrijving: response.headers.get('X-Error-Message') }
    return error;
  }
}
