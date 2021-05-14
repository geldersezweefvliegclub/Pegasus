import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() {
  }

  isIngelogd(): boolean {
    return false;
  }
}
