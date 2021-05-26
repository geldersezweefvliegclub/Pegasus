import {Injectable} from '@angular/core';
import {APIService} from '../apiservice/api.service';
import {Base64} from 'js-base64';

import { HeliosUserinfo } from '../../types/Helios';
import {StorageService} from "../storage/storage.service";



@Injectable({
  providedIn: 'root'
})
export class UserService {

  userInfo: HeliosUserinfo | null = null;

  constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {
  }

  isIngelogd(): boolean {
    if (this.userInfo == null) {
      if (this.storageService.ophalen("userInfo") == null) {
        return false;
      }
      this.userInfo = this.storageService.ophalen("userInfo");
      console.log(this.userInfo);
    }
    return true;
  }

  async login(gebruikersnaam: string, wachtwoord: string, token?: string): Promise<void> {

    const headers = new Headers();
    const base64encoded = Base64.encode(`${gebruikersnaam}:${wachtwoord}`);
    headers.append('Authorization', `Basic ${base64encoded}`);

    let urlParams: string = "";

    if ((token) && (token !== ""))  {
      urlParams = token
    }

    const response:Response = await this.APIService.get('Login/Login', [{'token': urlParams as string}],headers);

    if (response.ok) {
      await this.getUserInfo();
    }
  }

  async sendSMS(gebruikersnaam: string, wachtwoord: string): Promise<void> {

    const headers = new Headers();
    const base64encoded = Base64.encode(`${gebruikersnaam}:${wachtwoord}`);
    headers.append('Authorization', `Basic ${base64encoded}`);

    await this.APIService.get('Login/SendSMS', undefined,headers);
  }

  async getUserInfo(datum?: Date): Promise<void> {

    let urlParams: string = "";
    if (datum) {
      urlParams = "?DATUM=" + datum.toISOString().split('T')[0];
    }

    const response:Response = await this.APIService.get('Login/GetUserInfo' + urlParams);
    if (response.ok) {
      this.userInfo = await response.json();
      this.storageService.opslaan("userInfo", this.userInfo);
    }
  }

  uitloggen(): void {
    this.userInfo = null;
    this.storageService.verwijder ("userInfo");
  }
}
