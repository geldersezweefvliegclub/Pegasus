import {Injectable} from '@angular/core';
import {APIService} from '../apiservice/api.service';
import {Base64} from 'js-base64';
import {CookieService} from '../cookieservice/cookie.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private readonly APIService: APIService, private readonly cookieService: CookieService) {
  }

  isIngelogd(): boolean {
    return false;
  }

  async login(gebruikersnaam: string, wachtwoord: string, token?: string): Promise<void> {
    //todo fix
    /*
        const response = await fetch('https://localhost:4200/api/Login/Login', {
          method: 'GET',
          headers: headers,
          redirect: 'follow'
        })

        if (!response.ok) throw new Error(response.statusText)
         */
    const headers = new Headers();
    const base64encoded = Base64.encode(`${gebruikersnaam}:${wachtwoord}`)
    headers.append('Authorization', `Basic ${base64encoded}`);
    try {
      const response = await this.APIService.get('Login/Login')
    } catch (e) {
      //todo zet token van api
      this.cookieService.setToken('mocktoken', '.gezc.org')
      throw  e
    }
  }
}
