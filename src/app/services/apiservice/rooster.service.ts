import {Injectable} from '@angular/core';
import {DateTime} from 'luxon';
import {APIService} from './api.service';
import {KeyValueArray} from '../../types/Utils';
import {HeliosRooster, HeliosRoosterDataset} from '../../types/Helios';

@Injectable({
  providedIn: 'root'
})
export class RoosterService {

  constructor(private readonly APIService: APIService) {
  }

  async getRooster(startDatum: DateTime, eindDatum: DateTime): Promise<HeliosRoosterDataset[]> {
    let getParams: KeyValueArray = {};
    getParams['BEGIN_DATUM'] = startDatum.toISODate();
    getParams['EIND_DATUM'] = eindDatum.toISODate();

    try {
      const response: Response = await this.APIService.get('Rooster/GetObjects', getParams);

      const rooster:HeliosRooster = await response.json();
      return rooster.dataset as HeliosRoosterDataset[];
    } catch (e) {
      if (e.responseCode !== 404) { // er is geen data
        throw(e);
      }
      return [];
    }
  }
}
