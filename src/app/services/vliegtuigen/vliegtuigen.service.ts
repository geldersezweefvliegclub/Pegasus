import {Injectable} from '@angular/core';
import {APIService} from '../apiservice/api.service';

import {HeliosVliegtuig, HeliosVliegtuigen} from '../../types/Helios';
import {StorageService} from '../storage/storage.service';
import {getPackageManager} from "@angular/cli/utilities/package-manager";

@Injectable({
  providedIn: 'root'
})
export class VliegtuigenService {
  vliegtuigen: HeliosVliegtuigen | null = null;

  constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {

  }

  async getVliegtuigen(zoekString?:string): Promise<[]> {
    let hash: string = '';

    if (((this.vliegtuigen == null)) && (this.storageService.ophalen('vliegtuigen') != null)) {
      this.vliegtuigen = this.storageService.ophalen('vliegtuigen');
    }


    interface parameters {
      [key: string]: string;
    }
    let getParams:parameters = {};

    if (this.vliegtuigen != null) { // we hebben eerder de lijst opgehaald
      hash = this.vliegtuigen.hash as string;
      getParams['HASH'] = hash;
    }

    if (zoekString) {
      getParams['SELECTIE'] = zoekString;
    }

    try {
      const response: Response = await this.APIService.get('Vliegtuigen/GetObjects', [
        getParams
      ]);

      this.vliegtuigen = await response.json();
      this.storageService.opslaan('vliegtuigen', this.vliegtuigen);
    } catch (e) {
      if (e.responseCode !== 304) { // server bevat dezelfde data als cache
        throw(e);
      }
    }
    return this.vliegtuigen?.dataset as [];
  }

  async getVliegtuig(id: number): Promise<HeliosVliegtuig> {
    const response: Response = await this.APIService.get('Vliegtuigen/GetObject', [{'ID': id.toString()}]);

    return response.json();
  }
}
