/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/Startlijst/CreateTable": {
    post: {
      parameters: {
        query: {
          /** Dummy records aanmaken */
          FILLDATA: boolean;
        };
      };
      responses: {
        /** Aangemaakt, Tabel toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, bijv omdat de tabel al bestaat */
        500: unknown;
      };
    };
  };
  "/Startlijst/CreateViews": {
    post: {
      responses: {
        /** Aangemaakt, View toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, view niet aangemaak */
        500: unknown;
      };
    };
  };
  "/Startlijst/GetObject": {
    get: {
      parameters: {
        query: {
          /** Database ID van de vlucht */
          ID: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["oper_startlijst"];
          };
        };
        /** Data niet gevonden */
        404: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Startlijst/GetObjects": {
    get: {
      parameters: {
        query: {
          /** Database ID van het record */
          ID?: number;
          /** Toon welke records verwijderd zijn. Default = false */
          VERWIJDERD?: boolean;
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Sortering van de velden in ORDER BY formaat. Default = DATUM desc, Dagnummer */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query */
          MAX?: number;
          /** Eerste record in de dataset. Gebruikt in LIMIT query */
          START?: number;
          /** Begin datum (inclusief deze dag) */
          BEGIN_DATUM?: string;
          /** Eind datum (inclusief deze dag) */
          EIND_DATUM?: string;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
          /** De startmethode van de start. Zie voor ID de types met groep 5 */
          STARTMETHODE_ID?: string;
          /** Zoek in de NAAM, VLIEGTUIG */
          SELECTIE?: string;
          /** Startlijst voor bepaald lid, zowel als vlieger als inzittende */
          LID_ID?: number;
          /** Startlijst voor bepaald vliegtuig */
          VLIEGTUIG_ID?: number;
          /** Wanneer 'true', toon alleen de vluchten die nog niet geland zijn, of waar gezagvoeder onbekend is */
          OPEN_STARTS?: boolean;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["view_startlijst"];
          };
        };
        /** Data niet gemodificeerd, HASH in aanroep == hash in dataset */
        304: never;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Startlijst/GetLogboek": {
    get: {
      parameters: {
        query: {
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Sortering van de velden in ORDER BY formaat. Default, meerste recente vlucht eerst */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query */
          MAX?: number;
          /** Eerste record in de dataset. Gebruikt in LIMIT query */
          START?: number;
          /** Begin datum (inclusief deze dag) */
          BEGIN_DATUM?: string;
          /** Eind datum (inclusief deze dag) */
          EIND_DATUM?: string;
          /** Alle vluchten van het opgegven jaar */
          JAAR?: number;
          /** Logboek voor bepaald lid, indien niet aanwezig voor ingelogde gebruiker */
          LID_ID?: number;
          /** Logboek voor ingelogde lid op het gespecificeerde vliegtuig. Lid kan ook via LID_ID gezet worden */
          VLIEGTUIG_ID?: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["logboek"];
          };
        };
        /** Data niet gemodificeerd, HASH in aanroep == hash in dataset */
        304: never;
        /** Niet geautoriseerd, geen rechten om data op te halen */
        401: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Startlijst/GetLogboekTotalen": {
    get: {
      parameters: {
        query: {
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Alle vluchten van het opgegven jaar */
          JAAR?: number;
          /** Logboek voor specifiek lid, ID is database ID van het lid */
          LID_ID?: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["logboek_totalen"];
          };
        };
        /** Data niet gemodificeerd, HASH in aanroep == hash in dataset */
        304: never;
        /** Niet geautoriseerd, geen rechten om data op te halen */
        401: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Startlijst/GetVliegtuigLogboek": {
    get: {
      parameters: {
        query: {
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Sortering van de velden in ORDER BY formaat. Default, meerste recente vlucht eerst */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query */
          MAX?: number;
          /** Eerste record in de dataset. Gebruikt in LIMIT query */
          START?: number;
          /** Begin datum (inclusief deze dag) */
          BEGIN_DATUM?: string;
          /** Eind datum (inclusief deze dag) */
          EIND_DATUM?: string;
          /** Logboek voor specifiek vliegtuig, ID is database ID van het vliegtuig */
          ID?: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["vliegtuig_logboek"];
          };
        };
        /** Data niet gemodificeerd, HASH in aanroep == hash in dataset */
        304: never;
        /** Niet geautoriseerd, geen rechten om data op te halen */
        401: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Startlijst/GetVliegtuigLogboekTotalen": {
    get: {
      parameters: {
        query: {
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Alle vluchten van het opgegven jaar */
          JAAR?: number;
          /** Logboek voor specifiek vliegtuig, ID is database ID van het vliegtuig */
          ID?: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["vliegtuig_logboek_totalen"];
          };
        };
        /** Data niet gemodificeerd, HASH in aanroep == hash in dataset */
        304: never;
        /** Niet geautoriseerd, geen rechten om data op te halen */
        401: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Startlijst/DeleteObject": {
    delete: {
      parameters: {
        query: {
          /** Database ID van het start record. Meerdere ID's in CSV formaat */
          ID: string;
          /** Controleer of record bestaat voordat het verwijderd wordt. Default = true */
          VERIFICATIE?: boolean;
        };
      };
      responses: {
        /** Record verwijderd */
        204: never;
        /** Niet geautoriseerd, geen schrijfrechten */
        401: unknown;
        /** Data niet gevonden */
        404: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Startlijst/RestoreObject": {
    patch: {
      parameters: {
        query: {
          /** Database ID van het record. Meerdere ID's in CSV formaat */
          ID: string;
        };
      };
      responses: {
        /** Record(s) hersteld */
        202: unknown;
        /** Niet geautoriseerd, geen schrijfrechten */
        401: unknown;
        /** Data niet gevonden */
        404: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Startlijst/SaveObject": {
    put: {
      responses: {
        /** OK, data succesvol aangepast */
        200: {
          content: {
            "application/json": components["schemas"]["oper_startlijst"];
          };
        };
        /** Niet geautoriseerd, geen schrijfrechten */
        401: unknown;
        /** Data niet gevonden */
        404: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Conflict, lidnummer bestaat al */
        409: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
      /** start data */
      requestBody: {
        content: {
          "application/json": components["schemas"]["oper_startlijst_in"];
        };
      };
    };
    post: {
      responses: {
        /** OK, data succesvol toegevoegd */
        200: {
          content: {
            "application/json": components["schemas"]["oper_startlijst"];
          };
        };
        /** Niet geautoriseerd, geen schrijfrechten */
        401: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Conflict, lidnummer bestaat al */
        409: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
      /** start data */
      requestBody: {
        content: {
          "application/json": components["schemas"]["oper_startlijst_in"];
        };
      };
    };
  };
  "/Startlijst/GetRecency": {
    get: {
      parameters: {
        query: {
          /** Database ID van de vlieger */
          VLIEGER_ID: number;
          /** Peil datum van de recency */
          DATUM?: string;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["recency"];
          };
        };
        /** Data niet gevonden */
        404: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Startlijst/GetVliegDagen": {
    get: {
      parameters: {
        query: {
          /** Sortering van de velden in ORDER BY formaat. Default, meerste recente vlucht eerst */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query, default 10 dagen */
          MAX?: number;
          /** Begin datum (inclusief deze dag) */
          BEGIN_DATUM?: string;
          /** Eind datum (inclusief deze dag) */
          EIND_DATUM?: string;
          /** De vliegdagen voor bepaald lid, indien niet aanwezig voor ingelogde gebruiker */
          LID_ID?: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["vliegdagen"];
          };
        };
        /** Data niet gevonden */
        404: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
}

export interface components {
  schemas: {
    oper_startlijst_in: {
      /** Database ID van de vlucht */
      ID?: number;
      /** Datum van de start */
      DATUM?: string;
      /** Dagnummer, start iedere dag op 1 */
      DAGNUMMER?: number;
      /** Het vliegtuig ID. Verwijzing naar vliegtuigen tabel */
      VLIEGTUIG_ID?: number;
      /** Starttijd (hh:mm:ss) */
      STARTTIJD?: string;
      /** Starttijd (hh:mm:ss) */
      LANDINGSTIJD?: string;
      /** De manier van starten (lier / sleep / zelfstart) Verwijzing naar type tabel */
      STARTMETHODE_ID?: number;
      /** De vlieger van deze vlucht. Verwijzing naar leden tabel */
      VLIEGER_ID?: number;
      /** Wie zit er nog meer bij. Verwijzing naar leden tabel */
      INZITTENDE_ID?: number;
      /** De naam van de vlieger. Nodig indien de vlieger niet in de leden tabel staat */
      VLIEGERNAAM?: string;
      /** De naam van de vlieger. Nodig indien de vlieger niet in de leden tabel staat */
      INZITTENDENAAM?: string;
      /** Het sleepvliegtuig ID. Verwijzing naar vliegtuigen tabel */
      SLEEPKIST_ID?: number;
      /** Tot welke hoogte (meters) is er gesleept */
      SLEEP_HOOGTE?: number;
      /** Op welk veld is er gestart. Verwijzing naar type tabel */
      VELD_ID?: number;
      /** Extra text om opmerkingen toe te voegen */
      OPMERKINGEN?: string;
      /** Extra text om ID van extern systeem op te slaan */
      EXTERNAL_ID?: string;
    };
    oper_startlijst: components["schemas"]["oper_startlijst_in"] & {
      /** Is dit record gemarkeerd als verwijderd? */
      VERWIJDERD?: boolean;
      /** Tijdstempel van laaste aanpassing in de database */
      LAATSTE_AANPASSING?: string;
    };
    view_startlijst_dataset: components["schemas"]["oper_startlijst"] & {
      /** Registratie van het vliegtuig waarop gevlogen is */
      REGISTRATIE?: string;
      /** Callsign van het vliegtuig waarop gevlogen is */
      CALLSIGN?: string;
      /** Is het een club vliegtuig? */
      CLUBKIST?: boolean;
      /** Combinatie van registratie en callsign van het vliegtuig waarop gevlogen is */
      REG_CALL?: string;
      /** Hoe lang is er gevlogen. Indien landingstijd niet is ingevuld, op de dag zelf vliegtijd to nu toe, op alle andere dagen null */
      DUUR?: string;
      /** De naam van het lid zoals dat in ref_leden staat */
      VLIEGERNAAM_LID?: string;
      /** De naam van de inzittende zoals dat in ref_leden staat */
      INZITTENDENAAM_LID?: string;
      /** De manier van de start */
      STARTMETHODE?: string;
      /** Naam van het vliegveld waarop gestart is */
      VELD?: string;
    };
    view_startlijst: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      /** De dataset met records */
      dataset?: components["schemas"]["view_startlijst_dataset"][];
    };
    logboek: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      /** De dataset met records */
      dataset?: components["schemas"]["logboek_dataset"][];
    };
    logboek_dataset: {
      /** Database ID van de vlucht */
      ID?: number;
      /** Datum van de start */
      DATUM?: string;
      /** Combinatie van registratie en callsign van het vliegtuig waarop gevlogen is */
      REG_CALL?: string;
      /** Het vliegtuig ID. Verwijzing naar vliegtuigen tabel */
      VLIEGTUIG_ID?: number;
      /** Starttijd (hh:mm:ss) */
      STARTTIJD?: string;
      /** Starttijd (hh:mm:ss) */
      LANDINGSTIJD?: string;
      /** Hoe lang is er gevlogen. Indien landingstijd niet is ingevuld, op de dag zelf vliegtijd to nu toe, op alle andere dagen null */
      DUUR?: string;
      /** De naam van de vlieger */
      VLIEGERNAAM?: string;
      /** De naam van de inzittende */
      INZITTENDENAAM?: string;
      /** De vlieger van deze vlucht. Verwijzing naar leden tabel. LET OP; kan verwijzing zijn naar zusterclub of vergelijkbaar, de naam is dan handmatig ingevoerd. */
      VLIEGER_ID?: number;
      /** Wie zit er nog meer bij. Verwijzing naar leden tabel, kan null zijn als inzittende als tekst is ingevoerd */
      INZITTENDE_ID?: number;
      /** De manier van de start */
      STARTMETHODE?: string;
      /** De opmerkingen die ingevoerd zijn */
      OPMERKINGEN?: string;
    };
    logboek_totalen: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      /** Aantal van startmethodes */
      starts?: components["schemas"]["logboek_totalen_start"][];
      /** Aantal starts en vliegtijd per vliegtuig */
      vliegtuigen?: components["schemas"]["logboek_totalen_vliegtuigen"][];
      /** Totalen van het jaar */
      jaar?: {
        STARTS?: number;
        INSTRUCTIE_STARTS?: number;
        VLIEGTIJD?: string;
      };
    };
    logboek_totalen_start: {
      METHODE?: string;
      AANTAL?: number;
    };
    logboek_totalen_vliegtuigen: {
      REG_CALL?: string;
      STARTS?: number;
      VLIEGTIJD?: string;
    };
    vliegtuig_logboek: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      /** De dataset met records */
      dataset?: components["schemas"]["vliegtuig_logboek_dataset"][];
    };
    vliegtuig_logboek_dataset: {
      /** Datum */
      DATUM?: string;
      /** Aantal vluchten van deze dag */
      VLUCHTEN?: number;
      /** Aantal sleepstart op deze dag voor dit vliegtuig */
      LIERSTARTS?: number;
      /** Aantal sleepstart op deze dag voor dit vliegtuig */
      SLEEPSTARTS?: number;
      /** Starttijd (hh:mm) */
      VLIEGTIJD?: string;
      /** Combinatie van registratie en callsign van het vliegtuig waarop gevlogen is */
      REG_CALL?: string;
    };
    vliegtuig_logboek_totalen: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      totalen?: {
        /** Aantal vluchten in dit jaar */
        VLUCHTEN?: number;
        /** Aantal lierstarts voor dit jaar voor dit vliegtuig */
        LIERSTARTS?: number;
        /** Aantal sleepstarts voor dit jaarvoor dit vliegtuig */
        SLEEPSTARTS?: number;
        /** Starttijd (hhh:mm) */
        VLIEGTIJD?: string;
      };
      dataset?: {
        /** Maand */
        MAAND?: string;
        /** Aantal vluchten in deze maand */
        VLUCHTEN?: number;
        /** Aantal lierstarts voor deze maand voor dit vliegtuig */
        LIERSTARTS?: number;
        /** Aantal sleepstarts voor deze maand voor dit vliegtuig */
        SLEEPSTARTS?: number;
        /** Starttijd (hh:mm) */
        VLIEGTIJD?: string;
        /** Combinatie van registratie en callsign van het vliegtuig waarop gevlogen is */
        REG_CALL?: string;
      }[];
    };
    recency: {
      STARTS_DRIE_MND?: string;
      STARTS_VORIG_JAAR?: string;
      STARTS_DIT_JAAR?: string;
      UREN_DRIE_MND?: string;
      UREN_VORIG_JAAR?: string;
      UREN_DIT_JAAR?: string;
      STATUS_BAROMETER?: string;
      /** 0-10 = rood, 10-20 = geel, > 20 = groen.  Geeft inzicht waarde in de status */
      WAARDE?: number;
      STARTS_BAROMETER?: string;
      UREN_BAROMETER?: string;
    };
    vliegdagen: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      dataset?: {
        /** Datum van de start */
        DATUM?: string;
        STARTS?: number;
        VLIEGTIJD?: string;
      }[];
    };
  };
}

export interface operations {}
