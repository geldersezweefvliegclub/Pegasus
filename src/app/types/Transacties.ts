/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/Transacties/CreateTable": {
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
  "/Transacties/CreateViews": {
    post: {
      responses: {
        /** Aangemaakt, View toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, view niet aangemaak */
        500: unknown;
      };
    };
  };
  "/Transacties/GetObjects": {
    get: {
      parameters: {
        query: {
          /** Database ID van het aanwezig record */
          ID?: number;
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Sortering van de velden in ORDER BY formaat. Default = CLUBKIST DESC, VOLGORDE, REGISTRATIE */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query */
          MAX?: number;
          /** Eerste record in de dataset. Gebruikt in LIMIT query */
          START?: number;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
          /** Haal alle transactie records op van een specifiek lid */
          LID_ID?: string;
          /** Datum van de daginfo */
          DATUM?: string;
          /** Begin datum (inclusief deze dag) */
          BEGIN_DATUM?: string;
          /** Eind datum (inclusief deze dag) */
          EIND_DATUM?: string;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["oper_transactie"];
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
}

export interface components {
  schemas: {
    oper_transactie_in: {
      /**
       * Format: int32
       * @description Database ID van het record
       * @example 14
       */
      ID?: number;
      /**
       * Format: date
       * @description Datum van de transacties
       * @example 2022-03-29
       */
      DATUM?: string;
      /**
       * Format: int32
       * @description Voor welk is de transactie
       * @example 10115
       */
      LID_ID?: number;
      /**
       * Format: int32
       * @description Door wie is deze transactie aangemaakt
       * @example 10115
       */
      INGEVOERD_ID?: number;
      /**
       * @description Een bijschrijving van eenheden (betaald via bank)
       * @example 0
       */
      BETAALD?: boolean;
      /**
       * @description De afschrijving komt door een DDWV dag
       * @example 0
       */
      DDWV?: boolean;
      /**
       * Format: double
       * @description Het bedrag in Euro's
       * @example 0
       */
      BEDRAG?: number;
      /**
       * Format: numeric
       * @description Aantal strips voor deze transactie
       * @example 10115
       */
      EENHEDEN?: number;
      /**
       * Format: double
       * @description Het aantal eenheden voordat de transactie gestart is
       * @example 0
       */
      SALDO_VOOR?: number;
      /**
       * Format: double
       * @description Het aantal eenheden nadat de transactie afgerond is
       * @example 0
       */
      SALDO_NA?: number;
      /**
       * @description Een referentie naar vliegdag
       * @example vliegdag 2022-04-01
       */
      REFERENTIE?: string;
      /**
       * @description Een externe referentie van bank transactie
       * @example RABO 0648 904881
       */
      EXT_REF?: string;
      /**
       * @description Omschrijving van handmatige correctie
       * @example Ivm defecte lier, strippen retour
       */
      OMSCHRIJVING?: string;
      /**
       * @description Verwijzing naar extern url van de bank
       * @example https://www.xyz.com/url
       */
      BETAALD_URL?: string;
    };
    oper_transactie: components["schemas"]["oper_transactie_in"] & {
      /**
       * @description Is dit record gemarkeerd als verwijderd?
       * @example 0
       */
      VERWIJDERD?: boolean;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database
       * @example 2021-05-05 20:13:59Z
       */
      LAATSTE_AANPASSING?: string;
    };
    view_transactie_dataset: components["schemas"]["oper_transactie"] & {
      /**
       * @description De naam van het lid voor deze transactie
       * @example Momfer de Mol
       */
      NAAM?: string;
    };
    view_transactie: {
      /**
       * Format: int32
       * @description Aantal records dat voldoet aan de criteria in de database
       * @example 287
       */
      totaal?: number;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria
       * @example 2019-01-05 10:09:53
       */
      laatste_aanpassing?: string;
      /**
       * @description hash van de dataset
       * @example 9302aa0
       */
      hash?: string;
      /** @description De dataset met records */
      dataset?: components["schemas"]["view_transactie_dataset"][];
    };
  };
}

export interface operations {}

export interface external {}
