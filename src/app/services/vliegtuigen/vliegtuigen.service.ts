import { Injectable } from '@angular/core';
import {APIService} from '../apiservice/api.service';

import { HeliosVliegtuigen } from '../../types/Helios';
import { StorageService} from "../storage/storage.service";

@Injectable({
  providedIn: 'root'
})
export class VliegtuigenService {
  vliegtuigen: HeliosVliegtuigen | null = null;

  constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {

  }

  async getVliegtuigen(): Promise<[]> {
    let urlParams: string = "";

    if (((this.vliegtuigen == null)) && (this.storageService.ophalen("vliegtuigen") != null))
    {
      this.vliegtuigen = this.storageService.ophalen("vliegtuigen")
    }

    if (this.vliegtuigen != null) { // we hebben eerder de lijst opgehaald
      urlParams = "?HASH=" + this.vliegtuigen.hash;
    }

    try {
      const response: Response = await this.APIService.get('Vliegtuigen/GetObjects' + urlParams);
      if (response.ok) {
        this.vliegtuigen = await response.json();
        this.storageService.opslaan("vliegtuigen", this.vliegtuigen);
      }
    }
    catch (e) {
      if (e.responseCode !== 304) { // server bevat dezelfde data als cache
        throw(e);
      }
    }
    return this.vliegtuigen?.dataset as [];
  }
}
