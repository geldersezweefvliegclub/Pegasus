import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {HeliosType, HeliosTypes, HeliosVliegtuigen} from '../../types/Helios';
import {StorageService} from "../storage/storage.service";
import {KeyValueString} from "../../types/Utils";

@Injectable({
  providedIn: 'root'
})
export class TypesService {
  types: HeliosTypes | null = null;

  constructor(private readonly apiService: APIService, private readonly storageService: StorageService) {
  }

  async getTypes(groep: number): Promise<HeliosType[]> {
    let hash: string = '';

    if (((this.types == null)) && (this.storageService.ophalen('types-'+groep) != null)) {
      this.types = this.storageService.ophalen('types-'+groep);
    }

    let getParams: KeyValueString = {};

    getParams['GROEP'] = groep.toString();

    if (this.types != null) { // we hebben eerder de lijst opgehaald
      hash = this.types.hash as string;
      getParams['HASH'] = hash;
    }

    try {
      const response = await this.apiService.get('Types/GetObjects', getParams);

      this.types = await response.json();
      this.storageService.opslaan('types-'+groep, this.types);
    } catch (e) {
      if (e.responseCode !== 304) { // server bevat dezelfde data als cache
        throw(e);
      }
    }
    return this.types?.dataset as [];
  }
}
