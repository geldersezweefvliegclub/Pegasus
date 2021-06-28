import { Injectable } from '@angular/core';
import {StorageService} from "../storage/storage.service";
import {DateTime} from "luxon";
import {KeyValueString} from "../../types/Utils";
import {APIService} from '../apiservice/api.service';
import {HeliosAanwezigLeden, HeliosAanwezigLedenDataset} from '../../types/Helios';


@Injectable({
  providedIn: 'root'
})
export class AanwezigLedenService {
  aanwezig: HeliosAanwezigLeden | null = null;

  constructor(private readonly APIService: APIService, private readonly storageService: StorageService) {
  }

  async getAanwezig(startDatum: DateTime, eindDatum: DateTime, zoekString?: string, params: KeyValueString = {}): Promise<HeliosAanwezigLedenDataset[]> {
    let hash: string = '';

    if (((this.aanwezig == null)) && (this.storageService.ophalen('aanwezigLeden') != null)) {
      this.aanwezig = this.storageService.ophalen('aanwezigLeden');
    }

    let getParams: KeyValueString = params;

    if (this.aanwezig != null) { // we hebben eerder de lijst opgehaald
      hash = this.aanwezig.hash as string;
      getParams['HASH'] = hash;
    }

    getParams['BEGIN_DATUM'] = startDatum.toISODate();
    getParams['EIND_DATUM'] = eindDatum.toISODate();

    if (zoekString) {
      getParams['SELECTIE'] = zoekString;
    }

    try {
      const response: Response = await this.APIService.get('AanwezigLeden/GetObjects', getParams );

      this.aanwezig = await response.json();
      this.storageService.opslaan('aanwezigLeden', this.aanwezig);
    } catch (e) {
      if (e.responseCode !== 304) { // server bevat dezelfde data als cache
        throw(e);
      }
    }
    return this.aanwezig?.dataset as HeliosAanwezigLedenDataset[];
  }
}
