import {Injectable} from '@angular/core';
import {KeyValueString} from '../../types/Utils';

@Injectable({
  providedIn: 'root'
})
export class APIService {
  private URL = 'https://development.helios.org/'

  async post(): Promise<unknown> {
    throw Error('Post not implmented')
  }

  async put(): Promise<unknown> {
    throw Error('Put not implemented')
  }

  async get(url: string, headers?: Headers, params?: KeyValueString[]): Promise<unknown> {
    if (params) url = this.prepareEndpoint(url, params)

    return fetch(`${this.URL}${url}`, {
      method: "GET",
      credentials: "include"
    })
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

    return url
  }
}
