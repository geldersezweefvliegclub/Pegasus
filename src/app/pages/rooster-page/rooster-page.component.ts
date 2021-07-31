import {Component, OnInit} from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDropList} from '@angular/cdk/drag-drop';
import {LedenService} from '../../services/apiservice/leden.service';
import {HeliosLedenDataset, HeliosLid, HeliosRoosterDataset} from '../../types/Helios';
import {faCalendarDay, faTimesCircle, faUsers} from '@fortawesome/free-solid-svg-icons';
import {SharedService} from '../../services/shared/shared.service';
import {Subscription} from 'rxjs';
import {RoosterService} from '../../services/apiservice/rooster.service';
import {getBeginEindDatumVanMaand} from '../../utils/Utils';
import {CustomError} from '../../types/Utils';
import {DateTime} from 'luxon';

/*
{
            "ID": 14,
            "DATUM": "1953-10-18",
            "DDWV": true,
            "CLUB_BEDRIJF": false,
            "OCHTEND_DDI_ID": undefined,
            "OCHTEND_INSTRUCTEUR_ID": undefined,
            "OCHTEND_LIERIST_ID": undefined,
            "OCHTEND_HULPLIERIST_ID": undefined,
            "OCHTEND_STARTLEIDER_ID": undefined,
            "MIDDAG_DDI_ID": undefined,
            "MIDDAG_INSTRUCTEUR_ID": undefined,
            "MIDDAG_LIERIST_ID": undefined,
            "MIDDAG_HULPLIERIST_ID": undefined,
            "MIDDAG_STARTLEIDER_ID": undefined,
            "VERWIJDERD": false,
            "LAATSTE_AANPASSING": "2021-06-05 07:34:59",
            "OCHTEND_DDI": undefined,
            "OCHTEND_INSTRUCTEUR": undefined,
            "OCHTEND_HULPLIERIST": undefined,
            "OCHTEND_STARTLEIDER": undefined,
            "MIDDAG_DDI": undefined,
            "MIDDAG_INSTRUCTEUR": undefined,
            "MIDDAG_LIERIST": undefined,
            "OCHTEND_LIERIST": undefined,
            "MIDDAG_HULPLIERIST": undefined,
            "MIDDAG_STARTLEIDER": undefined
        }
*/

type HeliosLedenDatasetExtended = HeliosLedenDataset & {
  KEER_INGEDEELD?: number
}

@Component({
  selector: 'app-rooster-page',
  templateUrl: './rooster-page.component.html',
  styleUrls: ['./rooster-page.component.scss']
})
export class RoosterPageComponent implements OnInit {
  readonly roosterIcon = faCalendarDay;
  readonly ledenIcon = faUsers;
  readonly resetIcon = faTimesCircle;
  toonStartleiders = true;
  toonInstructeurs = true;
  toonLieristen = true;
  teZoekenNaam: string | undefined;
  alleLeden: HeliosLedenDataset[];
  gefilterdeLeden: HeliosLedenDatasetExtended[];
  huidigJaar: number;
  huidigMaand: number;
  private datumAbonnement: Subscription;
  private ledenTimer: number;
  isLoading: boolean = false;
  rooster: HeliosRoosterDataset[];

  constructor(
    private readonly ledenService: LedenService,
    private readonly sharedService: SharedService,
    private readonly roosterService: RoosterService) {
  }

  onDropInTable(event: CdkDragDrop<HeliosLedenDataset, any>, dagInRooster: HeliosRoosterDataset): void {
    // Haal de nieuwe en oude ID's op. Een id is bijvoorbeeld:
    // OCHTEND_LIERIST-0
    // 0 is de index in het rooster, dus de eerste dag van de maand.
    // OCHTEND_LIERIST is de taak die te vervullen is.
    const nieuwContainerId = event.container.id;
    const oudContrainerId = event.previousContainer.id;

    let naam;
    let id;
    // Als de nieuwe container hetzelfde is al de oude, doe dan niks.
    if (nieuwContainerId === oudContrainerId) {
      return;
    }
    // Als de actie van een container naar een andere container is geweest, controleren we eerst of de oude container de ledenlijst was of niet
    else if (nieuwContainerId !== oudContrainerId) {
      // De actie komt niet uit de ledenlijst, dus iemand is al ergens anders ingevuld. Die moeten we eerst leegmaken, en dan kunnen we de nieuwe vullen.
      if (oudContrainerId !== 'LEDENLIJST') {
        // We hakken de id op en halen de verschillende onderdelen eruit (taak en index van het rooster)
        const taakOnderdelen = this.getTaakEnIndexVanID(oudContrainerId);

        // We hebben van een dag naar een andere dag versleept dus data zit op een andere locatie.
        // Uit die data halen we de naam en id op die toen was gezet en zetten die op de nieuwe dag
        const data = event.item.dropContainer.data;
        naam = data[taakOnderdelen.taak];
        id = data[taakOnderdelen.taak + '_ID'];

        // En omdat we data verplaatsen, resetten vervolgens de dag waar we vandaan kwamen
        this.setTaakWaardes(this.rooster[taakOnderdelen.index], taakOnderdelen.taak, undefined, undefined);
      } else {
        // De oude container is wel de ledenlijst geweest, dus de data zit op deze locatie.
        const data = event.item.data;
        naam = data.NAAM;
        id = data.ID;
        // Verhoog ook het aantal keer ingedeeld van deze persoon, sorteer daarna de ledenlijst.
        data.KEER_INGEDEELD = data.KEER_INGEDEELD ? data.KEER_INGEDEELD + 1 : 1;
      }
    }
    const taak = this.getTaakEnIndexVanID(nieuwContainerId).taak;
    this.setTaakWaardes(dagInRooster, taak, id, naam);
  }

  /**
   * Wordt aangestuurd door de checkboxen. Clientside filteren voor rollen.
   * Voor filteren op namen wordt de backend aangeroepen.
   */
  filter(): void {
    this.isLoading = true;
    this.gefilterdeLeden = this.alleLeden.filter(ongefilterdLid => {
      let magTonen = false;
      if (this.toonLieristen && !magTonen) {
        magTonen = ongefilterdLid.LIERIST == true;
      }
      if (this.toonStartleiders && !magTonen) {
        magTonen = ongefilterdLid.STARTLEIDER == true;
      }
      if (this.toonInstructeurs && !magTonen) {
        magTonen = ongefilterdLid.INSTRUCTEUR == true;
      }
      return magTonen;
    });
    this.isLoading = false;
  }

  getLeden(): void {
    this.isLoading = true;
    clearTimeout(this.ledenTimer);
    this.ledenTimer = window.setTimeout(() => {
      let zoekString = undefined;
      if (this.teZoekenNaam && this.teZoekenNaam !== '') {
        zoekString = this.teZoekenNaam;
      }
      // todo leden ophalen uit service terugzetten (hieronder)
      setTimeout(() => {
        Promise.resolve().then(() => {
          this.alleLeden = [
            {
              'ID': 10923,
              'NAAM': 'Derek Aldridge',
              'VOORNAAM': 'Derek',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Aldridge',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-55824435',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'D_P_Aldridge@hotmail.com',
              'LIDNR': '201828',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'DerekA',
              'WACHTWOORD': '34f49490',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FDerekA%3Fsecret%3DGYEU3X4RF3JRCFZA%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_923_1537259601.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:42',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10422,
              'NAAM': 'Willem den Baars',
              'VOORNAAM': 'Willem',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Baars',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-41109495',
              'MOBIEL': '-',
              'NOODNUMMER': undefined,
              'EMAIL': 'Algemeen@denbaars.nl',
              'LIDNR': '201012',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': true,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2024-06-06',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'WillemdenB',
              'WACHTWOORD': 'd5278042',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FWillemdenB%3Fsecret%3DKMIUHX4FBZUORDDG%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_422_1549018937.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-07-17 21:49:21',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10272,
              'NAAM': 'Sietske Bakker',
              'VOORNAAM': 'Sietske',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Bakker',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-55325800',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'sietske_bakker@hotmail.com',
              'LIDNR': '200511',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2020-05-19',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'SietskeB',
              'WACHTWOORD': 'f81cfc17',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FSietskeB%3Fsecret%3DOF3RUW244346YJKJ%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_272_1324655037.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:49',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10523,
              'NAAM': 'Rien Bastiaanse',
              'VOORNAAM': 'Rien',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Bastiaanse',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-53885600',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'rienbastiaanse@casema.nl',
              'LIDNR': '201207',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': true,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2022-02-03',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RienB',
              'WACHTWOORD': '96a02bb',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRienB%3Fsecret%3DS4A5KNCQXDYLV6RT%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_523_1603289247.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-07-17 21:45:30',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10487,
              'NAAM': 'Rolf Beket',
              'VOORNAAM': 'Rolf',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Beket',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-29326214',
              'MOBIEL': '0314-640844',
              'NOODNUMMER': undefined,
              'EMAIL': 'rolfbeket@hotmail.nl',
              'LIDNR': '201128',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': true,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2019-04-06',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RolfB',
              'WACHTWOORD': '5c3cdc47',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRolfB%3Fsecret%3DJVULPCHLNZ6V2G67%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_487_1324654077.png',
              'HEEFT_BETAALD': false,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:59',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10127,
              'NAAM': 'Piet van den Berg',
              'VOORNAAM': 'Piet',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Berg',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-15208577',
              'MOBIEL': '0343-574615',
              'NOODNUMMER': undefined,
              'EMAIL': 'bergpiet@casema.nl',
              'LIDNR': '199225',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2017-03-03',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'PietvdB',
              'WACHTWOORD': '4be17a2a',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FPietvdB%3Fsecret%3DSGEEZ4OYJAZQMJCI%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_127_1306783916.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:42',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10309,
              'NAAM': 'Mark den Besten',
              'VOORNAAM': 'Mark',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Besten',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-30179052',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'markdenbesten@hotmail.com',
              'LIDNR': '200609',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': true,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2015-12-06',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'MarkdB',
              'WACHTWOORD': '1c3950f4',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FMarkdB%3Fsecret%3DBQVS7ETXDKL5FWPA%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_309.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:50',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10267,
              'NAAM': 'Jeppe de Boer',
              'VOORNAAM': 'Jeppe',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Boer',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-23125001',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'jeppedeboer@gmail.com',
              'LIDNR': '200509',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2019-10-26',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'JeppedB',
              'WACHTWOORD': '5452407c',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FJeppedB%3Fsecret%3DJ55QWMFYA3X7U2P3%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_267.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:49',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10480,
              'NAAM': 'Rob de Bruin',
              'VOORNAAM': 'Rob',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Bruin',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-46143543',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'rge.debruin@gmail.com',
              'LIDNR': '201141',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': true,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2017-03-07',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RobdB',
              'WACHTWOORD': 'cf36fd2',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRobdB%3Fsecret%3DPRFIXSC4GU5J3GBI%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_480_1404983970.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:58',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10973,
              'NAAM': 'Roelof Corporaal',
              'VOORNAAM': 'Roelof',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Corporaal',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-30880206',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'roelof.corporaal@gmail.com',
              'LIDNR': '202017',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RoelofC',
              'WACHTWOORD': '4c969ada',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRoelofC%3Fsecret%3D5AGE3VJEHRX7I7XU%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_973_1588499588.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:47',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10338,
              'NAAM': 'Jan Willem van Doorn',
              'VOORNAAM': 'Jan',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Doorn',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-46607227',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'jwvdoorn@gmail.com',
              'LIDNR': '200710',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': true,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2017-06-28',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'JanWillemvD',
              'WACHTWOORD': '37163277',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FJanWillemvD%3Fsecret%3DZU25OSELWKBSJTEM%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_338_1400161204.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:51',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10154,
              'NAAM': 'Tim Drubbel',
              'VOORNAAM': 'Tim',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Drubbel',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-53451858',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'drubbel@xs4all.nl',
              'LIDNR': '198202',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2015-03-23',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'TimD',
              'WACHTWOORD': '133beca',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FTimD%3Fsecret%3DKCSEFBMOMULJEXKA%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_154.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:44',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10462,
              'NAAM': 'Joris Felsbourg',
              'VOORNAAM': 'Joris',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Felsbourg',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-51420145',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'joris@felsbourg.eu',
              'LIDNR': '201125',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': true,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': true,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'JorisF',
              'WACHTWOORD': 'f163585',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FJorisF%3Fsecret%3DS4RM2I4OEUWWZLZ3%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_462_1487109520.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-07-17 21:50:02',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10169,
              'NAAM': 'Francis van Haaff',
              'VOORNAAM': 'Francis',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Haaff',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-28621038',
              'MOBIEL': '020-7861907',
              'NOODNUMMER': undefined,
              'EMAIL': 'vanhaaff@gmail.com',
              'LIDNR': '200206',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': true,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'FrancisvH',
              'WACHTWOORD': '6de47999',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FFrancisvH%3Fsecret%3DJ5TI3HTFKY226OUH%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_169.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:45',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10175,
              'NAAM': 'Wibro den Hollander',
              'VOORNAAM': 'Wibro',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Hollander',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-12556623',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'hollander@wibri.nl',
              'LIDNR': '199327',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2021-03-22',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'WibrodH',
              'WACHTWOORD': 'c6939320',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FWibrodH%3Fsecret%3DNVRD73PZW5F5SEH7%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_175.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:45',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10405,
              'NAAM': 'Ruud Holswilder',
              'VOORNAAM': 'Ruud',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Holswilder',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-51326132',
              'MOBIEL': '072-5896448',
              'NOODNUMMER': undefined,
              'EMAIL': 'ruudholswilder@me.com',
              'LIDNR': '201003',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2022-10-01',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RuudH',
              'WACHTWOORD': '48e96bcf',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRuudH%3Fsecret%3DQEMCPISYTZCCWKT5%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_405_1402748325.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:53',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10178,
              'NAAM': 'Erik Houtman',
              'VOORNAAM': 'Erik',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Houtman',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-10513739',
              'MOBIEL': '026-4743564',
              'NOODNUMMER': undefined,
              'EMAIL': 'erik.houtman1@gmail.com',
              'LIDNR': '197606',
              'LIDTYPE_ID': 601,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': true,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2023-03-19',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'ErikH',
              'WACHTWOORD': '71beff63',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FErikH%3Fsecret%3DFC2CMMPDMNAWCYU5%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_178.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:45',
              'LIDTYPE': 'Erelid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10881,
              'NAAM': 'Harry Huiskes',
              'VOORNAAM': 'Harry',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Huiskes',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-21872855',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'hjwhuiskes@home.nl',
              'LIDNR': '201721',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'HarryH',
              'WACHTWOORD': 'b8a0d4d9',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FHarryH%3Fsecret%3DNQJXXBSBWLBDWOZZ%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': undefined,
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:38',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10876,
              'NAAM': 'Steven Huiskes',
              'VOORNAAM': 'Steven',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Huiskes',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-18769766',
              'MOBIEL': '053-5360475',
              'NOODNUMMER': undefined,
              'EMAIL': 'Steven.huiskes@gmail.com',
              'LIDNR': '201716',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'StevenH',
              'WACHTWOORD': '54d80141',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FStevenH%3Fsecret%3DNNMY5PWA3IN22WZ3%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': undefined,
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:37',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10664,
              'NAAM': 'Francois Jeremiasse',
              'VOORNAAM': 'Francois',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Jeremiasse',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-17234377',
              'MOBIEL': '0167-567732',
              'NOODNUMMER': undefined,
              'EMAIL': 'post.fcj@gmail.com',
              'LIDNR': '201317',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': true,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'FrancoisJ',
              'WACHTWOORD': '768d6bbc',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FFrancoisJ%3Fsecret%3DEL4NHVT4QQUJ22GV%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': undefined,
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:14',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10188,
              'NAAM': 'Chris de Jong',
              'VOORNAAM': 'Chris',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Jong',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-22802351',
              'MOBIEL': '035-5242273',
              'NOODNUMMER': undefined,
              'EMAIL': 'secretaris@gezc.org',
              'LIDNR': '198204',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': true,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': true,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2020-04-09',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'ChrisdJ',
              'WACHTWOORD': '1c3459c2',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FChrisdJ%3Fsecret%3DAIQKE7PNCPE76QQI%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_188.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-07-17 21:46:04',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10925,
              'NAAM': 'Robert Jungblut',
              'VOORNAAM': 'Robert',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Jungblut',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-53164312',
              'MOBIEL': '026-4465775',
              'NOODNUMMER': undefined,
              'EMAIL': 'robertjungblut@outlook.com',
              'LIDNR': '201830',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RobJung',
              'WACHTWOORD': 'c8816188',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRobJung%3Fsecret%3DR2G725RGZB55PAIA%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_925_1546591283.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:42',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10196,
              'NAAM': 'Ton Kleverwal',
              'VOORNAAM': 'Ton',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Kleverwal',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-10498306',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'Kleverwal.ton@gmail.com',
              'LIDNR': '199416',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': true,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2015-09-23',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'TonK',
              'WACHTWOORD': '7b8f93f0',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FTonK%3Fsecret%3DQ4VXAN2WXJH4KHDO%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_196.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-07-17 21:44:08',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10926,
              'NAAM': 'Ferdi Koenders',
              'VOORNAAM': 'Ferdi',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Koenders',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-54918362',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'ferdi.koenders@gmail.com',
              'LIDNR': '201831',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'FerdiK',
              'WACHTWOORD': 'e85805fa',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FFerdiK%3Fsecret%3D5NPPQ2QSTQLDU4JD%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': undefined,
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:42',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10207,
              'NAAM': 'Sinan Kokbugur',
              'VOORNAAM': 'Sinan',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Kokbugur',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': undefined,
              'MOBIEL': '070-3693270',
              'NOODNUMMER': undefined,
              'EMAIL': 'skokbugur@xs4all.nl',
              'LIDNR': '200303',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'SinanK',
              'WACHTWOORD': 'd7be938b',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FSinanK%3Fsecret%3D4RRHWHU3UH5ODL7J%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': undefined,
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:46',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10199,
              'NAAM': 'Bas Krebbers',
              'VOORNAAM': 'Bas',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Krebbers',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-51535820',
              'MOBIEL': '020-6626463',
              'NOODNUMMER': undefined,
              'EMAIL': 'unibrein@gmail.com',
              'LIDNR': '198001',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2022-03-02',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'BasK',
              'WACHTWOORD': 'd08b51c4',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FBasK%3Fsecret%3DIZOBAHADN4AQWZYM%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_199.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:46',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10220,
              'NAAM': 'Reitze van der Linden',
              'VOORNAAM': 'Reitze',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Linden',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-54631475',
              'MOBIEL': '020-2231379',
              'NOODNUMMER': undefined,
              'EMAIL': 'Reitzevanderlinden@me.com',
              'LIDNR': '197604',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2021-10-20',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'ReitzevdL',
              'WACHTWOORD': '35aef1c7',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FReitzevdL%3Fsecret%3DO6L3AS4QH7GKBY7O%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_220.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:47',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10534,
              'NAAM': 'Marianne Looisen',
              'VOORNAAM': 'Marianne',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Looisen',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-42108419',
              'MOBIEL': '0318-418823',
              'NOODNUMMER': undefined,
              'EMAIL': 'mjlooisen@gmail.com',
              'LIDNR': '201210',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'MarianneL',
              'WACHTWOORD': '555530de',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FMarianneL%3Fsecret%3D66OW27QU23MK45J6%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_534_1332071013.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:03',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10223,
              'NAAM': 'Rob Looisen',
              'VOORNAAM': 'Rob',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Looisen',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-54748168',
              'MOBIEL': '0183-785276',
              'NOODNUMMER': undefined,
              'EMAIL': 'Roblooisen@gmail.com',
              'LIDNR': '198812',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2017-04-01',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RobL',
              'WACHTWOORD': '445b2d9',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRobL%3Fsecret%3DIVNZUS3ZNLIQ5W2A%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_223.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:47',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10536,
              'NAAM': 'Sape Miedema',
              'VOORNAAM': 'Sape',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Miedema',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-20403897',
              'MOBIEL': '0318-418823',
              'NOODNUMMER': undefined,
              'EMAIL': 'scmiedema@gmail.com',
              'LIDNR': '201211',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'SapeM',
              'WACHTWOORD': '618a0640',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FSapeM%3Fsecret%3DMD3TWTT7HNJ6ZMQ7%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_536_1332071304.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:04',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10686,
              'NAAM': 'David Muller',
              'VOORNAAM': 'David',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Muller',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-26396649',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'Mullerdav@hotmail.com',
              'LIDNR': '201403',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2022-02-14',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'DavidM',
              'WACHTWOORD': 'c5911c48',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FDavidM%3Fsecret%3D64YM3QTY444V22II%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': undefined,
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:02:16',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10224,
              'NAAM': 'Richard Oud',
              'VOORNAAM': 'Richard',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Oud',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-20256509',
              'MOBIEL': '030-6621834',
              'NOODNUMMER': undefined,
              'EMAIL': 'veiligheidsmanager@gezc.org',
              'LIDNR': '199801',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2022-02-26',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RichardO',
              'WACHTWOORD': '1f0214a6',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRichardO%3Fsecret%3D5COCE6QJUSDHL6VT%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_224_1507886382.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:47',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10225,
              'NAAM': 'Maurice Peters',
              'VOORNAAM': 'Maurice',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Peters',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-52833105',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'mauricepeters0@gmail.com',
              'LIDNR': '199509',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2021-03-28',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'MauriceP',
              'WACHTWOORD': 'a1993e92',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FMauriceP%3Fsecret%3D7HJXEFQQMDR6QEQP%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_225_1370093791.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:47',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10124,
              'NAAM': 'Joeri de Ronde',
              'VOORNAAM': 'Joeri',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Ronde',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-41151314',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'jaderonde@hotmail.com',
              'LIDNR': '200120',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2019-09-19',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'JoerideR',
              'WACHTWOORD': '6b180df4',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FJoerideR%3Fsecret%3DYCNBIPJJADRKRWBE%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_124.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:42',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10119,
              'NAAM': 'Richard de Ruiter',
              'VOORNAAM': 'Richard',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Ruiter',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-34265902',
              'MOBIEL': '0294-410349',
              'NOODNUMMER': undefined,
              'EMAIL': 'r2rn4all@hetnet.nl',
              'LIDNR': '199420',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2023-03-10',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RicharddR',
              'WACHTWOORD': '974f8d93',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRicharddR%3Fsecret%3DCAK6VOF6ZA5VYNXR%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_119.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:42',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10105,
              'NAAM': 'Sabine Scheffer',
              'VOORNAAM': 'Sabine',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Scheffer',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-51511003',
              'MOBIEL': '0578-629016',
              'NOODNUMMER': undefined,
              'EMAIL': 'info@tandartsscheffer.nl',
              'LIDNR': '199102',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2016-04-23',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'SabineS',
              'WACHTWOORD': '3fa1752d',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FSabineS%3Fsecret%3DFAJ5QHRS26VOH4HR%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_105_1348775201.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:41',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10240,
              'NAAM': 'Ronald Stellaard',
              'VOORNAAM': 'Ronald',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Stellaard',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-46262964',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'ronald.stellaard@gmail.com',
              'LIDNR': '200403',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': true,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2023-04-03',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RonaldS',
              'WACHTWOORD': '639aabb2',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRonaldS%3Fsecret%3DWNVS2BVY6OWQEX2K%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_240_1425891293.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:48',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10100,
              'NAAM': 'Andy van der Stelt',
              'VOORNAAM': 'Andy',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Stelt',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-20034657',
              'MOBIEL': '0578-629016',
              'NOODNUMMER': undefined,
              'EMAIL': 'andystelt@gmail.com',
              'LIDNR': '198206',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2014-04-01',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'AndyvdS',
              'WACHTWOORD': 'ae389c00',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FAndyvdS%3Fsecret%3D24MGQYQGPNXSWRW2%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_100.png',
              'HEEFT_BETAALD': false,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:40',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10091,
              'NAAM': 'Roel van der Veen',
              'VOORNAAM': 'Roel',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Veen',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-81818924',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'roelvanderveen@gmail.com',
              'LIDNR': '199511',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': '2021-06-03',
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'RoelvdV',
              'WACHTWOORD': '6be74575',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FRoelvdV%3Fsecret%3DERFDZVCU6DD7CYMQ%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_91_1499547605.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:40',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10684,
              'NAAM': 'Marco Vermeer',
              'VOORNAAM': 'Marco',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Vermeer',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-55145378',
              'MOBIEL': '0345-510611',
              'NOODNUMMER': undefined,
              'EMAIL': 'marco.r.vermeer@gmail.com',
              'LIDNR': '201402',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': true,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'MarcoV',
              'WACHTWOORD': '93bc6292',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FMarcoV%3Fsecret%3DOSQAKTC54ARKGR57%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_684_1437829428.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-07-17 21:47:24',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10360,
              'NAAM': 'Wolfert Voet',
              'VOORNAAM': 'Wolfert',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Voet',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-54270312',
              'MOBIEL': undefined,
              'NOODNUMMER': undefined,
              'EMAIL': 'wolfert.voet@gmail.com',
              'LIDNR': '200802',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'WolfertV',
              'WACHTWOORD': '3b62bf8f',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FWolfertV%3Fsecret%3DUODB57MGTCL535KQ%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_360_1425368722.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:51',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10450,
              'NAAM': 'Han Vos',
              'VOORNAAM': 'Han',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Vos',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-53159743',
              'MOBIEL': '015-2123443',
              'NOODNUMMER': undefined,
              'EMAIL': 'hanvos@hetnet.nl',
              'LIDNR': '198715',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'HanV',
              'WACHTWOORD': '5a9dc33f',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FHanV%3Fsecret%3DFJ5Q4KXNEQ75ZDUE%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_450_1354572291.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:55',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            },
            {
              'ID': 10083,
              'NAAM': 'Arjan Vrieze',
              'VOORNAAM': 'Arjan',
              'TUSSENVOEGSEL': undefined,
              'ACHTERNAAM': 'Vrieze',
              'ADRES': undefined,
              'POSTCODE': undefined,
              'WOONPLAATS': undefined,
              'TELEFOON': '06-29598925',
              'MOBIEL': '0318-624261',
              'NOODNUMMER': undefined,
              'EMAIL': 'gjvrieze@telfort.nl',
              'LIDNR': '198818',
              'LIDTYPE_ID': 602,
              'ZUSTERCLUB_ID': undefined,
              'LIERIST': false,
              'STARTLEIDER': false,
              'INSTRUCTEUR': true,
              'CIMT': false,
              'DDWV_CREW': false,
              'DDWV_BEHEERDER': false,
              'BEHEERDER': false,
              'STARTTOREN': false,
              'ROOSTER': false,
              'CLUBBLAD_POST': false,
              'MEDICAL': undefined,
              'GEBOORTE_DATUM': undefined,
              'INLOGNAAM': 'ArjanV',
              'WACHTWOORD': '4346ae10',
              'SECRET': 'https://api.qrserver.com/v1/create-qr-code/?data=otpauth%3A%2F%2Ftotp%2FArjanV%3Fsecret%3DDC6W5MZBHKLEKG3Y%26issuer%3DGeZC&size=200x200&ecc=M',
              'AUTH': false,
              'AVATAR': 'https://leden.gezc.org/avatars_gezc/avatar_83_1358597811.png',
              'HEEFT_BETAALD': true,
              'PRIVACY': false,
              'BEPERKINGEN': undefined,
              'OPMERKINGEN': undefined,
              'VERWIJDERD': false,
              'LAATSTE_AANPASSING': '2021-06-10 11:01:40',
              'LIDTYPE': 'Lid',
              'ZUSTERCLUB': undefined
            }
          ];
          this.filter();
          this.isLoading = false;
        });
      }, 150);
      /*this.ledenService.getLeden(false, zoekString).then(leden => {
        this.alleLeden = leden;
        this.filter();
        this.isLoading = false;
      }).catch(e => this.catchError(e));*/
    }, 400);
  }

  private getRooster(): void {
    this.isLoading = true;
    const beginEindDatum = getBeginEindDatumVanMaand(this.huidigMaand, this.huidigJaar);
    setTimeout(() => {
      //dit weghalen en vervangen met wat hieronder staat in comments
      Promise.resolve().then(() => {
        this.rooster = [
          {
            'DATUM': '2021-07-01'
          },
          {
            'DATUM': '2021-07-02'
          },
          {
            'DATUM': '2021-07-03'
          },
          {
            'DATUM': '2021-07-04'
          },
          {
            'DATUM': '2021-07-05'
          },
          {
            'DATUM': '2021-07-06'
          },
          {
            'DATUM': '2021-07-07'
          },
          {
            'DATUM': '2021-07-08'
          },
          {
            'DATUM': '2021-07-09'
          },
          {
            'DATUM': '2021-07-10'
          },
          {
            'DATUM': '2021-07-11'
          },
          {
            'DATUM': '2021-07-12'
          },
          {
            'DATUM': '2021-07-13'
          },
          {
            'DATUM': '2021-07-14'
          },
          {
            'DATUM': '2021-07-15'
          },
          {
            'DATUM': '2021-07-16'
          },
          {
            'DATUM': '2021-07-17'
          },
          {
            'DATUM': '2021-07-18'
          },
          {
            'DATUM': '2021-07-19'
          },
          {
            'DATUM': '2021-07-20'
          },
          {
            'DATUM': '2021-07-21'
          },
          {
            'DATUM': '2021-07-22'
          },
          {
            'DATUM': '2021-07-23'
          },
          {
            'DATUM': '2021-07-24'
          },
          {
            'DATUM': '2021-07-25'
          },
          {
            'DATUM': '2021-07-26'
          },
          {
            'DATUM': '2021-07-27'
          },
          {
            'DATUM': '2021-07-28'
          },
          {
            'DATUM': '2021-07-30'
          },
          {
            'DATUM': '2021-07-31'
          }
        ];
        this.vulMissendeDagenAan();
        this.isLoading = false;
      });
    }, 100);

    /*this.roosterService.getRooster(beginEindDatum.begindatum, beginEindDatum.einddatum).then(rooster => {
      console.log(rooster);
      this.rooster = rooster;
      this.vulMissendeDagenAan();
      this.isLoading = false;
    }).catch(e => this.catchError(e));*/
  }

  /**
   * Haal alle informatie op
   * @private
   */
  private opvragen() {
    this.getLeden();
    this.getRooster();
  }

  ngOnInit(): void {
    this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
      this.huidigMaand = jaarMaand.month;
      this.huidigJaar = jaarMaand.year;
      this.opvragen();
    });
  }

  /**
   * Vang een API error af
   * @param {CustomError} e
   * @private
   */
  private catchError(e: CustomError) {
    console.error(e);
    this.isLoading = false;
  }

  /**
   * Het opgehaalde rooster kan dagen in de maand missen. Deze functie vult alle data aan zodat elke dag in de maand getoond wordt.
   * @private
   * @return {void}
   */
  private vulMissendeDagenAan(): void {
    const dagenInDeMaand = DateTime.fromObject({year: this.huidigJaar, month: this.huidigMaand}).daysInMonth;
    for (let i = 0; i < dagenInDeMaand; i++) {
      const datumInRooster = DateTime.fromISO((this.rooster[i]?.DATUM || ''));
      const nieuwDagInRooster: HeliosRoosterDataset = {
        DATUM: DateTime.fromObject({month: this.huidigMaand, year: this.huidigJaar, day: i + 1}).toISODate()
      };

      if (datumInRooster.isValid) {
        const dag = datumInRooster.day;
        if (dag > i + 1) {
          this.rooster.splice(i, 0, nieuwDagInRooster);
        }
      } else {
        this.rooster.splice(i, 0, nieuwDagInRooster);
      }
    }
  }

  /**
   * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over lierist.
   * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
   * @return {boolean}
   */
  lieristEvaluatie(item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
    return this.controleerRol(item, 'LIERIST');
  }

  /**
   * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over instructeurs.
   * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
   * @return {boolean}
   */
  instructeurEvaluatie(item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
    return this.controleerRol(item, 'INSTRUCTEUR');
  }

  /**
   * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over startleiders.
   * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
   * @return {boolean}
   */
  startleiderEvaluatie(item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
    return this.controleerRol(item, 'STARTLEIDER');
  }

  /**
   * Deze functie evalueert of de content een bepaalde rol is. Als dat zo is, returned hij true, anders false.
   * Als de meegegeven rol bijv. LIERIST is, kan een instructeur bijv. geen lieristdienst draaien.
   */
  controleerRol(item: CdkDrag<HeliosLid | HeliosRoosterDataset>, rol: 'LIERIST' | 'INSTRUCTEUR' | 'STARTLEIDER'): boolean {
    // Content komt uit de ledenlijst of niet
    if (item.dropContainer.id === 'LEDENLIJST') {
      const data = item.data;
      return data[rol];
    } else {
      const data = item.dropContainer.data;
      const taak = this.getTaakEnIndexVanID(item.dropContainer.id).taak;
      const id = data[taak + '_ID'];
      // We moeten in alle leden zoeken, omdat de filter criteria veranderd kan zijn, waardoor een lid niet gevonden wordt.
      const lid = this.alleLeden.find(lid => lid.ID === id);
      return lid ? (lid[rol] || false) : false;
    }
  }

  onDropInLedenlijst(event: CdkDragDrop<HeliosLedenDataset[], any>): void {
    // De nieuwe container is hetzelfde als de vorige, doe dan niks.
    if (event.container === event.previousContainer) {
      return;
    } else {
      const data = event.item.dropContainer.data;
      const roosterDag = this.rooster.find(dag => dag.DATUM === data.DATUM);
      const taak = this.getTaakEnIndexVanID(event.item.dropContainer.id).taak;

      if (roosterDag) {
        this.setTaakWaardes(roosterDag, taak, undefined, undefined);
      }
    }
  }

  /**
   * Deel iemand in op een taak op een bepaalde dag
   * @param {HeliosRoosterDataset} roosterdag
   * @param {string} taak
   * @param {string | undefined} id
   * @param {string | undefined} naam
   * @return {void}
   */
  setTaakWaardes(roosterdag: HeliosRoosterDataset, taak: string, id: string | undefined, naam: string | undefined): void {
    roosterdag[taak] = naam;
    roosterdag[taak + '_ID'] = id;
  }

  /**
   * Hak een id op om de informatie in de ID te gebruiken
   * Een id is bijvoorbeeld:
   * OCHTEND_LIERIST-0
   * 0 is de index in de rooster array, 0 is dus de 1e dag van de maand.
   * OCHTEND_LIERIST is de taak
   * @param {string} id
   * @return {{taak: string, index: number}}
   */
  getTaakEnIndexVanID(id: string): { taak: string, index: number } {
    const taakEnIndex = id.split('-');
    return {
      taak: taakEnIndex[0],
      index: parseInt(taakEnIndex[1])
    };
  }
}
