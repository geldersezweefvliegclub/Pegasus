import { Injectable } from '@angular/core';
import {APIService} from './api.service';
import {DateTime} from "luxon";
import {KeyValueString} from "../../types/Utils";
import {HeliosDagInfo, HeliosDagInfoDagen} from "../../types/Helios";
import {StorageService} from "../storage/storage.service";


@Injectable({
  providedIn: 'root'
})
export class DaginfoService {
  DagInfo: HeliosDagInfoDagen | null = null;
  dagen: HeliosDagInfoDagen | null = null;

  constructor(private readonly APIService: APIService, private readonly storageService: StorageService) { }


  async getDagen(startDatum: DateTime, eindDatum: DateTime): Promise<[]> {
    interface parameters {
      [key: string]: string;
    }

    let getParams: parameters = {};
    getParams['BEGIN_DATUM'] = startDatum.toISODate();
    getParams['EIND_DATUM'] = eindDatum.toISODate();
    getParams['VELDEN'] = "ID,DATUM";

    try {
      const response: Response = await this.APIService.get('Daginfo/GetObjects',
          getParams
      );

      this.dagen = await response.json();

    } catch (e) {
      if (e.responseCode !== 404) { // er is geen data
        throw(e);
      }
    }
    return this.dagen?.dataset as [];

  }

  async getDagInfoDagen(verwijderd: boolean = false, startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueString = {}): Promise<[]> {
    let hash: string = '';

    if (((this.DagInfo == null)) && (this.storageService.ophalen('daginfo') != null)) {
      this.DagInfo = this.storageService.ophalen('daginfo');
    }

    let getParams: KeyValueString = params;

    if (this.DagInfo != null) { // we hebben eerder de lijst opgehaald
      hash = this.DagInfo.hash as string;
      getParams['HASH'] = hash;
    }

    getParams['BEGIN_DATUM'] = startDatum.toISODate();
    getParams['EIND_DATUM'] = eindDatum.toISODate();

    if (zoekString) {
      getParams['SELECTIE'] = zoekString;
    }

    if (verwijderd) {
      getParams['VERWIJDERD'] = "true";
    }

    try {
      const response: Response = await this.APIService.get('Daginfo/GetObjects', getParams );

      this.DagInfo = await response.json();
      this.storageService.opslaan('starts', this.DagInfo);
    } catch (e) {
      if (e.responseCode !== 304) { // server bevat dezelfde data als cache
        throw(e);
      }
    }
    return this.DagInfo?.dataset as [];
  }

  async getDagInfo(id: number): Promise<HeliosDagInfo> {
    const response: Response = await this.APIService.get('Daginfo/GetObject', {'ID': id.toString()});

    return response.json();
  }

  async nieuweDagInfo(vliegtuig: HeliosDagInfo) {
    const response: Response = await this.APIService.post('Daginfo/SaveObject', JSON.stringify(vliegtuig));
    return response.json();
  }

  async updateDagInfo(vliegtuig: HeliosDagInfo) {
    const response: Response = await this.APIService.put('Daginfo/SaveObject', JSON.stringify(vliegtuig));

    return response.json();
  }

  async deleteDagInfo(id: number) {
    try {
      await this.APIService.delete('Daginfo/DeleteObject', {'ID': id.toString()});
    } catch (e) {
      throw(e);

    }
  }

  async restoreDagInfo(id: number) {
    try {
      await this.APIService.patch('Daginfo/RestoreObject', {'ID': id.toString()});
    } catch (e) {
      throw(e);
    }
  }
}
