import {Injectable} from '@angular/core';
import {APIService} from '../apiservice/api.service';
import {CookieService} from '../cookieservice/cookie.service';
import {Base64} from 'js-base64';

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

    const headers = new Headers();
    const base64encoded = Base64.encode(`${gebruikersnaam}:${wachtwoord}`);
    headers.append('Authorization', `Basic ${base64encoded}`);
    const response = await this.APIService.get('Login/GetUserInfo', headers);
    console.log(response.headers);
    console.log('token', token);

    //todo zet token van api
    // this.cookieService.setToken('mocktoken', '.gezc.org');
  }
}
