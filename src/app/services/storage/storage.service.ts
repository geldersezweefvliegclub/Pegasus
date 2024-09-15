import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  vervalTijd = 60;  // 60 min

  public opslaan(key:string, value:any, tijd : number = this.vervalTijd): void {
    const now = new Date()

    const tijdMsec = tijd * 1000 * 60 // van minuten naar msec
    let expireTimestamp = now.getTime() + tijdMsec;

    if (tijd < 0) {
      expireTimestamp = now.setDate(now.getDate() + 5000);  // 5000 dagen vooruit
    }

    const item = {
      value: value,
      expiry: expireTimestamp
    }
    localStorage.setItem(key, JSON.stringify(item))
  }

  public ophalen(key:string): any {
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
