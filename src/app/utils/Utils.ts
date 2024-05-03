import {DateTime, Interval} from 'luxon';

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


export const DagVanDeWeek = (datum: string | null): string => {
  if(!datum) return "??"
  const dt: DateTime = DateTime.fromSQL(datum);

  switch (dt.weekday) {
    case 1:
      return "Maandag";
    case 2:
      return "Dinsdag";
    case 3:
      return "Woensdag";
    case 4:
      return "Donderdag";
    case 5:
      return "Vrijdag";
    case 6:
      return "Zaterdag";
    case 7:
      return "Zondag";
    default:
      return "??";
  }
}

export const DateDiff = (datum1 : string, datum2: string|undefined = undefined) : number => {
  const dt1: DateTime = DateTime.fromSQL(datum1);
  const dt2: DateTime = (datum2 == undefined) ? DateTime.now() : DateTime.fromSQL(datum2);

  if (dt1 < dt2) {
    const diff = Interval.fromDateTimes(dt1, dt2);
    return -1* Math.floor(diff.length("days"))
  }
  else {
    const diff = Interval.fromDateTimes(dt2, dt1);
    return Math.ceil(diff.length("days"))
  }

}

