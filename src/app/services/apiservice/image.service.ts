import {Injectable} from '@angular/core';
import {APIService} from './api.service';
import {base64ToFile} from 'ngx-image-cropper';

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
    // Maak een data object aan alsof we een HTML formulier ingevuld hebben.
    const formEmulated = new FormData();
    formEmulated.append('ID', ID.toString());
    console.log(base64ToFile(base64string), base64string);
    formEmulated.append('FILE', base64ToFile(base64string));

    const response = await this.apiService.post('Leden/UploadAvatar', formEmulated);

    return response.json();
  }
}
