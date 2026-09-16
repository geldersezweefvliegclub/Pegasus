import { Injectable } from '@angular/core';

export type StorageType = 'local' | 'session';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  vervalTijdMinuten = 60;  // 60 min

  /**
   * Slaat een waarde op in de browseropslag.
   *
   * Naast de waarde wordt ook een vervaldatum opgeslagen. Zodra de waarde
   * verlopen is, geeft {@link ophalen} deze niet meer terug.
   *
   * Een negatieve vervaltijd betekent dat de waarde zeer lang bewaard wordt
   * (ongeveer 5000 dagen).
   *
   * @param key De unieke naam waaronder de waarde wordt opgeslagen.
   * @param value De waarde die moet worden opgeslagen. Dit mag elk type zijn
   *   dat door `JSON.stringify` kan worden verwerkt.
   * @param vervaltijdInMinuten Het aantal minuten waarna de waarde verloopt.
   *   Standaard is dit 60 minuten.
   * @param storageType Bepaalt waar de waarde wordt opgeslagen:
   *   `local` voor `localStorage` of `session` voor `sessionStorage`.
   *   Standaard is `local`.
   */
  public opslaan(
    key: string,
    value: unknown,
    vervaltijdInMinuten: number | null = this.vervalTijdMinuten,
    storageType: StorageType = 'local'
  ): void {
    const now = new Date()

    if (!vervaltijdInMinuten) {
      vervaltijdInMinuten = this.vervalTijdMinuten;
    }

    const tijdMsec = vervaltijdInMinuten * 1000 * 60 // van minuten naar msec
    let expireTimestamp = now.getTime() + tijdMsec;

    if (vervaltijdInMinuten < 0) {
      expireTimestamp = now.setDate(now.getDate() + 5000);  // 5000 dagen vooruit
    }

    const item = {
      value: value,
      expiry: expireTimestamp
    }
    this.getStorage(storageType).setItem(key, JSON.stringify(item))
  }

  /**
   * Haalt een waarde op uit de browseropslag.
   *
   * Geeft `null` terug als de sleutel niet bestaat of als de opgeslagen waarde
   * verlopen is. Verlopen waarden worden meteen uit de opslag verwijderd.
   *
   * Het type `T` helpt alleen TypeScript tijdens het compileren. De methode
   * controleert of zet het type niet om tijdens runtime. Gebruik daarom alleen
   * een type waarvan je zeker weet dat het overeenkomt met de opgeslagen waarde.
   *
   * @example
   * ```ts
   * const naam = storageService.ophalen<string>('naam');
   * ```
   *
   * In dit voorbeeld verwacht TypeScript een `string | null`. Als de opslag
   * echter een object bevat, wordt dat object ook daadwerkelijk teruggegeven.
   *
   * @param key De naam van de waarde die moet worden opgehaald.
   * @param storageType Bepaalt waar de waarde wordt gezocht:
   *   `local` voor `localStorage` of `session` voor `sessionStorage`.
   *   Standaard is `local`.
   * @returns De opgeslagen waarde, of `null` als deze ontbreekt of verlopen is.
   */
  public ophalen<T>(key: string, storageType: StorageType = 'local'): T | null {
    const storage = this.getStorage(storageType);
    const jsonString: string | null = storage.getItem(key)

    if (jsonString == null)
      return null;

    const item = JSON.parse(jsonString);
    const now = new Date()
    // compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
      // If the item is expired, delete the item from storage
      // and return null
      storage.removeItem(key)
      return null;
    }
    return item.value;
  }

  /**
   * Verwijdert een waarde uit de browseropslag.
   *
   * @param key De naam van de waarde die moet worden verwijderd.
   * @param storageType Bepaalt uit welke opslag de waarde wordt verwijderd:
   *   `local` voor `localStorage` of `session` voor `sessionStorage`.
   *   Standaard is `local`.
   */
  public verwijder(key: string, storageType: StorageType = 'local'): void {
    this.getStorage(storageType).removeItem(key)
  }

  private getStorage(storageType: StorageType): Storage {
    return storageType === 'session' ? sessionStorage : localStorage;
  }
}
