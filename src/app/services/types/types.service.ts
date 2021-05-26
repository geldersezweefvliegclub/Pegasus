import {Injectable} from '@angular/core';
import {APIService} from '../apiservice/api.service';
import {HeliosType} from '../../types/Helios';

@Injectable({
  providedIn: 'root'
})
export class TypesService {

  constructor(private readonly apiService: APIService) {
  }

  async getTypes(groep: number): Promise<HeliosType[]> {
    const response = await this.apiService.get('Types/GetObjects', [{'GROEP': groep.toString()}]);

    const data = await response.json();
    return data.dataset;
  }
}
