
export type KeyValueArray = Record<string, string | number | boolean>;;

export interface ErrorMessage {
    responseCode?: number | null,
    beschrijving: string | null
}

export interface SuccessMessage {
    titel: string| null,
    beschrijving: string | null
}

export interface KalenderMaand {
    year: number,
    month: number
}

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
