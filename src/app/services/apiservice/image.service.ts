import { Injectable } from '@angular/core';
import { APIService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor(private readonly apiService: APIService) {
  }

  /**
   * Upload een avatar van een lid
   * @param {number} ID - Het ID van het lid
   * @param {string} base64string - De nieuwe avatar encoded in een base64 string
   * @return {Promise<string>} - De URL waar de nieuwe avatar geupload is.
   */
  async uploadFoto(ID: number, base64string: string): Promise<string> {
    // Maak een starts object aan alsof we een HTML formulier ingevuld hebben.
    const formEmulated = new FormData();
    formEmulated.append('ID', ID.toString());
    formEmulated.append('FILE', base64string);

    const response = await this.apiService.post('Leden/UploadAvatar', formEmulated);

    return response.json();
  }
}
