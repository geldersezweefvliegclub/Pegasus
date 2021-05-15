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
    return true;
  }

  async login(gebruikersnaam: string, wachtwoord: string, token?: string): Promise<void> {
    //todo fix

    const headers = new Headers();
    const base64encoded = Base64.encode(`${gebruikersnaam}:${wachtwoord}`);
    headers.append('Authorization', `Basic ${base64encoded}`);

    const response = await this.APIService.get('Login/Login', headers);
    console.log(response);
    console.log('token', token);
    //todo zet token van api
    // postman geeft voorbeeld in code gen :)
    this.cookieService.setToken('mocktoken', '.gezc.org');
  }
}
