/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/Reservering/CreateTable": {
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
  "/Reservering/CreateViews": {
    post: {
      responses: {
        /** Aangemaakt, View toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, view niet aangemaak */
        500: unknown;
      };
    };
  };
  "/Reservering/GetObject": {
    get: {
      parameters: {
        query: {
          /** Database ID van het reserverings record */
          ID?: number;
        };
      };
      responses: {
        /** OK, starts succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["oper_reservering"];
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
  "/Reservering/GetObjects": {
    get: {
      parameters: {
        query: {
          /** Database ID van het reserverings record */
          ID?: number;
          /** Toon welke records verwijderd zijn. Default = false */
          VERWIJDERD?: boolean;
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om starts verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde starts bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen starts verzonden als het nodig is. */
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
          /** Reserveringen voor een lid */
          LID_ID?: number;
          /** Startlijst voor bepaald vliegtuig */
          VLIEGTUIG_ID?: number;
        };
      };
      responses: {
        /** OK, starts succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["view_reserveringen"];
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
  "/Reservering/DeleteObject": {
    delete: {
      parameters: {
        query: {
          /** Database ID van het reserverings record. Meerdere ID's in CSV formaat */
          ID?: string;
          /** Controleer of record bestaat voordat het verwijderd wordt. Default = true */
          VERIFICATIE?: boolean;
        };
      };
      responses: {
        /** Reservering verwijderd */
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
  "/Reservering/SaveObject": {
    post: {
      responses: {
        /** OK, starts succesvol toegevoegd */
        200: {
          content: {
            "application/json": components["schemas"]["oper_reservering"];
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
      /** Reservering starts */
      requestBody: {
        content: {
          "application/json": components["schemas"]["oper_reservering_in"];
        };
      };
    };
  };
}

export interface components {
  schemas: {
    oper_reservering_in: {
      /** Database ID van het reserverings record */
      ID?: number;
      /** Datum van de reservering */
      DATUM?: string;
      /** Het vliegtuig ID. Verwijzing naar vliegtuigen tabel */
      VLIEGTUIG_ID?: number;
      /** Het lid ID. Verwijzing naar leden tabel */
      LID_ID?: number;
      /** Is kist geboekt voor een langere periode. Toekenning door beheerder */
      IS_GEBOEKT?: boolean;
      /** De opmerkingen die voor deze reserving van toepassing zijn */
      OPMERKINGEN?: string;
    };
    oper_reservering: components["schemas"]["oper_reservering_in"] & {
      /** Is dit record gemarkeerd als verwijderd? */
      VERWIJDERD?: boolean;
      /** Tijdstempel van laaste aanpassing in de database */
      LAATSTE_AANPASSING?: string;
    };
    view_reserveringen_dataset: components["schemas"]["oper_reservering"] & {
      /** Naam van het lid dat het vliegtuig heeft gereserveerd */
      NAAM?: string;
      /** Staat privacy maskering aan voor het lid, Zo ja, dan is NAAM "..." */
      PRIVACY?: boolean;
      /** Naam van het lid dat de reservering gemaakt heeft */
      INGEVOERD_DOOR?: { [key: string]: any };
      /** Het registratie nummer van het vliegtuig wat gereserveerd */
      REGISTRATIE?: string;
      /** Optioneel het callsign van het vliegtuig wat gereserveerd */
      CALLSIGN?: string;
      /** Combinatie van registratie en callsign van het vliegtuig wat gereserveerd */
      REG_CALL?: string;
    };
    view_reserveringen: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      /** De dataset met records */
      dataset?: components["schemas"]["view_reserveringen_dataset"][];
    };
  };
}

export interface operations {}
