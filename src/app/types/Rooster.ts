/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/Rooster/CreateTable": {
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
  "/Rooster/CreateViews": {
    post: {
      responses: {
        /** Aangemaakt, View toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, view niet aangemaak */
        500: unknown;
      };
    };
  };
  "/Rooster/GetObject": {
    get: {
      parameters: {
        query: {
          /** Database ID van het rooster record */
          ID?: number;
          /** Datum van het rooster */
          DATUM?: string;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["oper_rooster"];
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
  "/Rooster/GetObjects": {
    get: {
      parameters: {
        query: {
          /** Database ID van het aanwezig record */
          ID?: number;
          /** Toon welke records verwijderd zijn. Default = false */
          VERWIJDERD?: boolean;
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Sortering van de velden in ORDER BY formaat. Default = DATUM DESC */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query */
          MAX?: number;
          /** Eerste record in de dataset. Gebruikt in LIMIT query */
          START?: number;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
          /** Zoek op datum */
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
            "application/json": components["schemas"]["view_rooster"];
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
  "/Rooster/DeleteObject": {
    delete: {
      parameters: {
        query: {
          /** Database ID van het rooster record. Meerdere ID's in CSV formaat */
          ID?: string;
          /** Datum van het rooster */
          DATUM?: string;
          /** Controleer of record bestaat voordat het verwijderd wordt. Default = true */
          VERIFICATIE?: boolean;
        };
      };
      responses: {
        /** Rooster verwijderd */
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
  "/Rooster/RestoreObject": {
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
  "/Rooster/SaveObject": {
    put: {
      responses: {
        /** OK, data succesvol aangepast */
        200: {
          content: {
            "application/json": components["schemas"]["oper_rooster"];
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
        /** Conflict, datum bestaat al */
        409: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
      /** Rooster data */
      requestBody: {
        content: {
          "application/json": components["schemas"]["oper_rooster_in"];
        };
      };
    };
    post: {
      responses: {
        /** OK, data succesvol toegevoegd */
        200: {
          content: {
            "application/json": components["schemas"]["oper_rooster"];
          };
        };
        /** Niet geautoriseerd, geen schrijfrechten */
        401: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Conflict, datum bestaat al */
        409: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
      /** Rooster data */
      requestBody: {
        content: {
          "application/json": components["schemas"]["oper_rooster_in"];
        };
      };
    };
  };
}

export interface components {
  schemas: {
    oper_rooster_in: {
      /**
       * Format: int32
       * @description Database ID van het rooster record
       * @example 77
       */
      ID?: number;
      /**
       * Format: date
       * @description Datum van de vliegdag
       * @example 2017-07-21
       */
      DATUM?: string;
      /**
       * @description Is het een DDWV dag?
       * @example 0
       */
      DDWV?: boolean;
      /**
       * @description Is er een clubbedrijf
       * @example 1
       */
      CLUB_BEDRIJF?: boolean;
      /**
       * @description Wordt er gesleuteld aan vliegtuigen / rollend materieel
       * @example 0
       */
      WINTER_WERK?: boolean;
      /**
       * Format: int32
       * @description Minimaal aantal aanmeldingen voordat we gaan slepen (alleen DDWV)
       * @example 3
       */
      MIN_SLEEPSTART?: number;
      /**
       * Format: int32
       * @description Minimaal aantal aanmeldingen voordat we gaan lieren (alleen DDWV)
       * @example 10
       */
      MIN_LIERSTART?: number;
      /**
       * @description De opmerkingen die voor deze dag van toepassing zijn
       * @example EH-R122 actief ivm oefening gyros
       */
      OPMERKINGEN?: string;
    };
    oper_rooster: components["schemas"]["oper_rooster_in"] & {
      /**
       * @description Is dit record gemarkeerd als verwijderd?
       * @example 0
       */
      VERWIJDERD?: boolean;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database
       * @example 2020-04-17 07:29:01
       */
      LAATSTE_AANPASSING?: string;
    };
    view_rooster_dataset: components["schemas"]["oper_rooster"];
    view_rooster: {
      /**
       * Format: int32
       * @description Aantal records dat voldoet aan de criteria in de database
       * @example 287
       */
      totaal?: number;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria
       * @example 2020-07-022 16:39:25
       */
      laatste_aanpassing?: string;
      /**
       * @description hash van de dataset
       * @example 4d00b3f
       */
      hash?: string;
      /** @description De dataset met records */
      dataset?: components["schemas"]["view_rooster_dataset"][];
    };
  };
}


