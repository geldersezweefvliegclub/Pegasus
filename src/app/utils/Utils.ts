import {DateTime} from 'luxon';

export const nummerSort = (num1: number, num2: number) => {
  return (num1 > num2) ? 1 : -1;
};

export const tijdSort = (tijdStr1: string | null, tijdStr2: string | null) => {
  if (tijdStr1 == null) {
    tijdStr1 = '00:00';
  }

  if (tijdStr2 == null) {
    tijdStr2 = '00:00';
  }

  let tijdParts1: string[] = tijdStr1.split(':');
  let tijdParts2: string[] = tijdStr2.split(':');

  let tijd1: number = Number(tijdParts1[0]) * 60 + Number(tijdParts1[1]);
  let tijd2: number = Number(tijdParts2[0]) * 60 + Number(tijdParts2[1]);

  return (tijd1 > tijd2) ? 1 : -1;
};

export const getBeginEindDatumVanMaand = (maand: number, jaar: number): { begindatum: DateTime, einddatum: DateTime } => {
  const startDatum = DateTime.fromObject({day: 1, month: maand, year: jaar});
  const dagenInDeMaand = startDatum.daysInMonth;
  const eindDatum = DateTime.fromObject({month: maand, year: jaar, day: dagenInDeMaand});
  return {begindatum: startDatum, einddatum: eindDatum};
};
