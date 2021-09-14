
export interface KeyValueArray {
  [key: string]: string
};

export type ErrorMessage = {
    responseCode?: number | null,
    beschrijving: string | null
};

export type SuccessMessage = {
    titel: string| null,
    beschrijving: string | null
};

export type KalenderMaand = {
    year: number,
    month: number
};

// type event naar het Helios backend
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
