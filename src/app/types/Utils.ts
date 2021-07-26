
export interface KeyValueArray {
  [key: string]: string
};

export type CustomError = {
    responseCode?: number | null,
    beschrijving: string | null
};

export type KalenderMaand = {
    year: number,
    month: number
};

export enum HeliosActie {
    Add,
    Update,
    Delete,
    Restore
}

// Interactie database events
export class HeliosEvent
{
    tabel: string;
    actie: HeliosActie;
    data: any;
}
