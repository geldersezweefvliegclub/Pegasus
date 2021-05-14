import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  constructor() { }


  /** Plaatst cookie voor token
   * @param token: token om in cookie te zetten
   * @param domain: Het domein waar de cookie vandaan komt.
   */
  setToken(token: string, domain: string): void {
    // todo fix domain
    document.cookie = `PHPSESSID=${token};domain=localhost;SameSite=lax;path=/`;
  }

  /** haalt token op uit cookies
   * @return token als string
   */
  getToken(): string {
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
    return '';
  }

  /** checkt of de gebruiker is ingelogd
   * @return boolean, als de token bestaat stuurt dit true terug, anders false
   */
  isIngelogd(): boolean {
    return this.getToken() !== '';
  }

  logUit(): void {
    document.cookie = 'PHPSESSID=;SameSite=Lax;path=/';
  }
}
