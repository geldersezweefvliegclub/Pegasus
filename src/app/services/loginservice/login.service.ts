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
    return this.cookieService.getToken() !== undefined;
  }

  async login(gebruikersnaam: string, wachtwoord: string, token?: string): Promise<void> {
    const headers = new Headers();
    const base64encoded = Base64.encode(`${gebruikersnaam}:${wachtwoord}`);
    headers.append('Authorization', `Basic ${base64encoded}`);
    await this.APIService.get('Login/Login', headers);
  }
}
