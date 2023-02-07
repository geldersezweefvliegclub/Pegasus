/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/Documenten/CreateTable": {
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
  "/Documenten/CreateViews": {
    post: {
      responses: {
        /** Aangemaakt, View toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, view niet aangemaak */
        500: unknown;
      };
    };
  };
  "/Documenten/GetObject": {
    get: {
      parameters: {
        query: {
          /** Database ID van het document record */
          ID?: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["document"];
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
  "/Documenten/GetObjects": {
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
          /** Groep ID voor de opvraag (meerdere groupen in CSV formaat) */
          GROEPEN?: string;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["view_documenten"];
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
  "/Documenten/DeleteObject": {
    delete: {
      parameters: {
        query: {
          /** Database ID van het document record. Meerdere ID's in CSV formaat */
          ID?: string;
          /** Controleer of record bestaat voordat het verwijderd wordt. Default = true */
          VERIFICATIE?: boolean;
        };
      };
      responses: {
        /** Document verwijderd */
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
  "/Documenten/RestoreObject": {
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
  "/Documenten/SaveObject": {
    put: {
      responses: {
        /** OK, data succesvol aangepast */
        200: {
          content: {
            "application/json": components["schemas"]["document"];
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
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
      /** Document meta data */
      requestBody: {
        content: {
          "application/json": components["schemas"]["document_in"];
        };
      };
    };
    post: {
      responses: {
        /** OK, data succesvol toegevoegd */
        200: {
          content: {
            "application/json": components["schemas"]["document"];
          };
        };
        /** Niet geautoriseerd, geen schrijfrechten */
        401: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
      requestBody: {
        content: {
          "multipart/form-data": {
            document?: components["schemas"]["document_in"];
            /** Format: binary */
            file?: string;
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    document_in: {
      /**
       * Format: int32
       * @description Database ID van het document record
       * @example 77
       */
      ID?: number;
      /**
       * Format: int32
       * @description Verwijzing naar type tabel (22) in welke groep document behoord
       * @example 2022
       */
      GROEP_ID?: number;
      /**
       * Format: int32
       * @description Volgorde binnen de groep
       * @example 3
       */
      VOLGORDE?: number;
      /**
       * @description De tekst die uitlegt wat document behelst
       * @example Handboek Duo Discuss
       */
      TEKST?: string;
      /**
       * @description Verwijzing waar het document gevonden kan worden
       * @example Handboek Duo Discuss
       */
      URL?: string;
      /**
       * @description Lege regel om paragraaf te kunnen maken
       * @example 0
       */
      LEGE_REGEL?: boolean;
      /**
       * @description Plaats een horizontale lijn
       * @example 0
       */
      ONDERSTREEP?: boolean;
      /**
       * @description Plaats een horizontale lijn aan de bovenkant (true) / onderkant (false)
       * @example 0
       */
      BOVEN?: boolean;
    };
    document: components["schemas"]["document_in"] & {
      /**
       * @description Is dit record gemarkeerd als verwijderd?
       * @example 0
       */
      VERWIJDERD?: boolean;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database
       * @example 2026-01-31 14:12:56
       */
      LAATSTE_AANPASSING?: string;
    };
    view_documenten_dataset: components["schemas"]["document"] & {
      [key: string]: unknown;
    };
    view_documenten: {
      /**
       * Format: int32
       * @description Aantal records dat voldoet aan de criteria in de database
       * @example 287
       */
      totaal?: number;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria
       * @example 2001-11-30 11:12:17
       */
      laatste_aanpassing?: string;
      /**
       * @description hash van de dataset
       * @example aa9ab4b
       */
      hash?: string;
      /** @description De dataset met records */
      dataset?: components["schemas"]["view_documenten_dataset"][];
    };
  };
}

export interface operations {}

export interface external {}