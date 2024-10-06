import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  vervalTijdMinuten = 60;  // 60 min

  /**
   * Sla een item op in de local storage, met een tijd wanneer het vervalt.
   * @param key Key om het item op te slaan in de localstorage
   * @param value Het item dat opgeslagen moet worden. Kan elk type zijn.
   * @param vervaltijdInMinuten De tijd in minuten wanneer het item vervalt. Standaard 60 minuten.
   */
  public opslaan(key:string, value: unknown, vervaltijdInMinuten: number = this.vervalTijdMinuten): void {
    const now = new Date()

    const tijdMsec = vervaltijdInMinuten * 1000 * 60 // van minuten naar msec
    let expireTimestamp = now.getTime() + tijdMsec;

    if (vervaltijdInMinuten < 0) {
      expireTimestamp = now.setDate(now.getDate() + 5000);  // 5000 dagen vooruit
    }

    const item = {
      value: value,
      expiry: expireTimestamp
    }
    localStorage.setItem(key, JSON.stringify(item))
  }

  public ophalen(key:string): unknown {
    const jsonString:string | null = localStorage.getItem(key)

    if (jsonString == null)
      return null;

    const item = JSON.parse(jsonString);
    const now = new Date()
    // compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
      // If the item is expired, delete the item from storage
      // and return null
      localStorage.removeItem(key)
      return null;
    }
    return item.value;
  }


  public verwijder(key: string): void {
    localStorage.removeItem(key)
  }
}
