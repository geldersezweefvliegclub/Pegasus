/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/Types/CreateTable": {
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
  "/Types/CreateViews": {
    post: {
      responses: {
        /** Aangemaakt, View toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, view niet aangemaak */
        500: unknown;
      };
    };
  };
  "/Types/GetObject": {
    get: {
      parameters: {
        query: {
          /** Database ID van het type record */
          ID: number;
        };
      };
      responses: {
        /** OK, starts succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["ref_types"];
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
  "/Types/GetObjects": {
    get: {
      parameters: {
        query: {
          /** Database ID van het aanwezig record */
          ID?: number;
          /** Toon welke records verwijderd zijn. Default = false */
          VERWIJDERD?: boolean;
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om starts verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde starts bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen starts verzonden als het nodig is. */
          HASH?: string;
          /** Sortering van de velden in ORDER BY formaat. Default = CLUBKIST DESC, VOLGORDE, REGISTRATIE */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query */
          MAX?: number;
          /** Eerste record in de dataset. Gebruikt in LIMIT query */
          START?: number;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
          /** Haal alle lidTypes op van een specieke groep */
          GROEP?: number;
        };
      };
      responses: {
        /** OK, starts succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["view_types"];
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
  "/Types/DeleteObject": {
    delete: {
      parameters: {
        query: {
          /** Database ID van het record. Meerdere ID's in CSV formaat */
          ID: number;
          /** Controleer of record bestaat voordat het verwijderd wordt. Default = true */
          VERIFICATIE?: boolean;
        };
      };
      responses: {
        /** Type verwijderd */
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
  "/Types/RestoreObject": {
    patch: {
      parameters: {
        query: {
          /** Database ID van het record. Meerdere ID's in CSV formaat */
          ID: number;
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
  "/Types/SaveObject": {
    put: {
      responses: {
        /** OK, starts succesvol aangepast */
        200: {
          content: {
            "application/json": components["schemas"]["ref_types"];
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
      /** type starts */
      requestBody: {
        content: {
          "application/json": components["schemas"]["ref_types_in"];
        };
      };
    };
    post: {
      responses: {
        /** OK, starts succesvol toegevoegd */
        200: {
          content: {
            "application/json": components["schemas"]["ref_types"];
          };
        };
        /** Niet geautoriseerd, geen schrijfrechten */
        401: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Niet aanvaardbaar, input ontbreekt */
        406: unknown;
        /** Conflict, record bestaat al */
        409: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
      /** type starts */
      requestBody: {
        content: {
          "application/json": components["schemas"]["ref_types_in"];
        };
      };
    };
  };
}

export interface components {
  schemas: {
    ref_types_in: {
      /** Database ID van het record */
      ID?: number;
      /** Type groep */
      GROEP?: number;
      /** Zeer korte beschrijving van de code */
      CODE?: string;
      /** Hoe kennen andere systemen / organisatie deze code */
      EXT_REF?: string;
      /** Volledige omschrijving van het type */
      OMSCHRIJVING?: string;
      /** Volgorde in de HMI */
      SORTEER_VOLGORDE?: number;
      /** Is dit record (met ID) hard gecodeerd in de source code. Zo ja, dan niet aanpassen. */
      READ_ONLY?: boolean;
    };
    ref_types: components["schemas"]["ref_types_in"] & {
      /** Is dit record gemarkeerd als verwijderd? */
      VERWIJDERD?: boolean;
      /** Tijdstempel van laaste aanpassing in de database */
      LAATSTE_AANPASSING?: string;
    };
    view_types: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      /** De dataset met records */
      dataset?: components["schemas"]["ref_types"][];
    };
  };
}

export interface operations {}
