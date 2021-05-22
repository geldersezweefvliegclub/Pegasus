import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  constructor() { }

  /** haalt token op uit cookies
   * @return token als string
   */
  getToken(): string | undefined{
    const key = 'PHPSESSID=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let c of ca) {
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(key) === 0) {
        return c.substring(key.length, c.length);
      }
    }
    return undefined;
  }

  logUit(): void {
    document.cookie = 'PHPSESSID=;SameSite=Lax;path=/';
  }
}
