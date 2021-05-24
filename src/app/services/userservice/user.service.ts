import {Injectable} from '@angular/core';
import {APIService} from '../apiservice/api.service';
import {Base64} from 'js-base64';

import { Userinfo } from '../../types/helios';
import {StorageService} from "../storage/storage.service";



@Injectable({
  providedIn: 'root'
})
export class UserService {

  userInfo: Userinfo | null = null;

  constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {
  }

  isIngelogd(): boolean {
    if (this.userInfo == null) {
      if (this.storageService.ophalen("userInfo") == null) {
        return false;
      }
      this.userInfo = this.storageService.ophalen("userInfo");
    }
    return true;
  }

  async login(gebruikersnaam: string, wachtwoord: string, token?: string): Promise<void> {

    const headers = new Headers();
    const base64encoded = Base64.encode(`${gebruikersnaam}:${wachtwoord}`);
    headers.append('Authorization', `Basic ${base64encoded}`);

    let urlParams: string = "";

    if ((token) && (token !== ""))  {
      urlParams = "?token=" + token
    }

    const response:Response = await this.APIService.get('Login/Login' + urlParams, headers);

    if (response.ok) {
      await this.getUserInfo();
    }
  }

  async sendSMS(gebruikersnaam: string, wachtwoord: string): Promise<void> {

    const headers = new Headers();
    const base64encoded = Base64.encode(`${gebruikersnaam}:${wachtwoord}`);
    headers.append('Authorization', `Basic ${base64encoded}`);

    const response = await this.APIService.get('Login/SendSMS', headers);
  }

  async getUserInfo(datum?: Date): Promise<void> {

    let urlParams: string = "";
    if (datum != null) {
      urlParams = "?DATUM=" + datum.toISOString().split('T')[0];
    }

    const response:Response = await this.APIService.get('Login/GetUserInfo' + urlParams);
    if (response.ok) {
      this.userInfo = await response.json();
      this.storageService.opslaan("userInfo", this.userInfo);
      console.log("done");
    }
  }
}
