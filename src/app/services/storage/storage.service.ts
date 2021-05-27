import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  vervalTijd: number = 1000 * 60 * 60;  // 1 uur (1000 msec * 60 sec = 1 min * 60)

  constructor() { }

  public opslaan(key:string, value:any): void {
    const now = new Date()

    const item = {
      value: value,
      expiry: now.getTime() + this.vervalTijd
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
