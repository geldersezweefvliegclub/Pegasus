
export interface KeyValueString {
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

export const nummerSort = (num1: number, num2: number) => {
    return (num1 > num2) ? 1 : -1;
};

export const tijdSort = (tijdStr1: string | null, tijdStr2: string | null) => {
    if (tijdStr1 == null) {
        tijdStr1 = "00:00";
    }

    if (tijdStr2 == null) {
        tijdStr2 = "00:00";
    }

    let tijdParts1:string[] = tijdStr1.split(':')
    let tijdParts2:string[] = tijdStr2.split(':')

    let tijd1:number = Number(tijdParts1[0]) * 60 + Number(tijdParts1[1]);
    let tijd2:number = Number(tijdParts2[0]) * 60 + Number(tijdParts2[1]);

    return (tijd1 > tijd2) ? 1 : -1;
};