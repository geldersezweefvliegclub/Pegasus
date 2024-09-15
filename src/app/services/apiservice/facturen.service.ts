import { Injectable } from '@angular/core';
import {
  HeliosFacturen, HeliosFacturenDataset,
  HeliosFactuur,
} from "../../types/Helios";
import {APIService} from "./api.service";
import {KeyValueArray} from "../../types/Utils";


@Injectable({
  providedIn: 'root'
})
export class FacturenService {
  private facturenCache: HeliosFacturen = {dataset: []};      // return waarde van API call
  private teDoenCache: HeliosFacturen = {dataset: []};        // return waarde van API call

  constructor(private readonly apiService: APIService) {
  }

  async getFacturen(Jaar: number, zoekString?: string): Promise<HeliosFacturenDataset[]> {
    const getParams: KeyValueArray = {};

    getParams['JAAR'] = Jaar

    if ((this.facturenCache != undefined) && (this.facturenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
      getParams['HASH'] = this.facturenCache.hash;
    }

    if (zoekString) {
      getParams['SELECTIE'] = zoekString;
    }

    try {
      const response: Response = await this.apiService.get('Facturen/GetObjects', getParams);
      this.facturenCache = await response.json();
    } catch (e) {
      if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
        throw (e);
      }
    }
    return this.facturenCache?.dataset as HeliosFacturenDataset[];
  }

  async getFactuur(id: number): Promise<HeliosFactuur> {
    const response: Response = await this.apiService.get('Facturen/GetObject', {'ID': id.toString()});
    return response.json();
  }

  async nogTeFactureren(Jaar: number): Promise<HeliosFacturenDataset[]> {
    const getParams: KeyValueArray = {};

    getParams['JAAR'] = Jaar

    if ((this.teDoenCache != undefined) && (this.teDoenCache.hash != undefined)) { // we hebben eerder de lijst opgehaald
      getParams['HASH'] = this.teDoenCache.hash;
    }


    try {
      const response: Response = await this.apiService.get('Facturen/NogTeFactureren', getParams);
      this.teDoenCache = await response.json();
    } catch (e) {
      if ((e.responseCode !== 304) && (e.responseCode !== 704)) { // server bevat dezelfde starts als cache
        throw (e);
      }
    }
    return this.teDoenCache?.dataset as HeliosFacturenDataset[];
  }



  async addFactuur(factuur: HeliosFactuur) {
    const response: Response = await this.apiService.post('Facturen/SaveObject', JSON.stringify(factuur));
    return response.json();
  }

  async updateFactuur(factuur: HeliosFactuur) {
    const response: Response = await this.apiService.put('Facturen/SaveObject', JSON.stringify(factuur));

    return response.json();
  }

  async deleteFactuur(id: number) {
    await this.apiService.delete('Facturen/DeleteObject', {'ID': id.toString()});
  }

  async restoreFactuur(id: number) {
    await this.apiService.patch('Facturen/RestoreObject', {'ID': id.toString()});
  }

  async aanmakenFacturen(Jaar: number, ledenID: number[]) {

    const response: Response = await this.apiService.post('Facturen/AanmakenFacturen', JSON.stringify({JAAR: Jaar, LID_ID: ledenID}));
    return response.json();
  }

  async uploadFactuur(factuurID: number) {
    const f = {ID: factuurID}
    const response: Response = await this.apiService.post('Facturen/UploadFactuur', JSON.stringify(f));
    return response.json();
  }
}
