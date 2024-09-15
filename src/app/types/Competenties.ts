/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/Competenties/CreateTable": {
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
  "/Competenties/CreateViews": {
    post: {
      responses: {
        /** Aangemaakt, View toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, view niet aangemaak */
        500: unknown;
      };
    };
  };
  "/Competenties/GetObject": {
    get: {
      parameters: {
        query: {
          /** Database ID van het type record */
          ID: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["ref_competenties"];
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
  "/Competenties/GetObjects": {
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
          /** Sortering van de velden in ORDER BY formaat. Default = CLUBKIST DESC, VOLGORDE, REGISTRATIE */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query */
          MAX?: number;
          /** Eerste record in de dataset. Gebruikt in LIMIT query */
          START?: number;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
          /** Haal alle types op van een specieke leerfase */
          LEERFASE_ID?: string;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["view_competenties"];
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
  "/Competenties/CompetentiesBoom": {
    get: {
      parameters: {
        query: {
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["progressie_boom"][];
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
  "/Competenties/DeleteObject": {
    delete: {
      parameters: {
        query: {
          /** Database ID van het record. Meerdere ID's in CSV formaat */
          ID: string;
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
  "/Competenties/RestoreObject": {
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
  "/Competenties/SaveObject": {
    put: {
      responses: {
        /** OK, data succesvol aangepast */
        200: {
          content: {
            "application/json": components["schemas"]["ref_competenties"];
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
      /** type data */
      requestBody: {
        content: {
          "application/json": components["schemas"]["ref_competenties_in"];
        };
      };
    };
    post: {
      responses: {
        /** OK, data succesvol toegevoegd */
        200: {
          content: {
            "application/json": components["schemas"]["ref_competenties"];
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
      /** type data */
      requestBody: {
        content: {
          "application/json": components["schemas"]["ref_competenties_in"];
        };
      };
    };
  };
}

export interface components {
  schemas: {
    ref_competenties_in: {
      /**
       * Format: int32
       * @description Database ID van het record
       * @example 12871
       */
      ID?: number;
      /**
       * Format: int16
       * @description Volgorde van weergave
       * @example 1
       */
      VOLGORDE?: number;
      /**
       * Format: int32
       * @description In welke leerfase zit deze competentie. Verwijzing naar ref_types
       * @example 1
       */
      LEERFASE_ID?: number;
      /**
       * @description Volgnummer
       * @example 3.4
       */
      BLOK?: string;
      /**
       * Format: int32
       * @description Verwijzing naar bovenliggend record van boom structuur
       * @example 300
       */
      BLOK_ID?: number;
      /**
       * @description Volledige omschrijving van de compententie
       * @example Uitstap procedure
       */
      ONDERWERP?: string;
      /**
       * @description Verwijzing naar de volledige documentie
       * @example VVO1.14
       */
      DOCUMENTATIE?: string;
      /**
       * @description Is er een einde aan de geldigheid van deze comptentie (bijv theorie)
       * @example 0
       */
      GELDIGHEID?: boolean;
      /**
       * @description Hebben we een score 1/5 voor deze comptentie? Zo nee, dan alleen wel/niet
       * @example 0
       */
      SCORE?: boolean;
    };
    ref_competenties: components["schemas"]["ref_competenties_in"] & {
      /**
       * @description Is dit record gemarkeerd als verwijderd?
       * @example 0
       */
      VERWIJDERD?: boolean;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database
       * @example 2019-05-01 16:42:00
       */
      LAATSTE_AANPASSING?: string;
    };
    view_competenties_dataset: components["schemas"]["ref_competenties"] & {
      /**
       * @description Fase van de vliegopleiding
       * @example Voortgezette vliegopleiding 1
       */
      LEERFASE?: string;
    };
    view_competenties: {
      /**
       * Format: int32
       * @description Aantal records dat voldoet aan de criteria in de database
       * @example 287
       */
      totaal?: number;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria
       * @example 2020-06-06 13:02:02
       */
      laatste_aanpassing?: string;
      /**
       * @description hash van de dataset
       * @example ada0b20
       */
      hash?: string;
      /** @description De dataset met records */
      dataset?: components["schemas"]["view_competenties_dataset"][];
    };
    progressie_kaart: {
      /**
       * Format: int32
       * @description Aantal records dat voldoet aan de criteria in de database
       * @example 287
       */
      totaal?: number;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria
       * @example 2021-05-29T13:44:05Z
       */
      laatste_aanpassing?: string;
      /**
       * @description hash van de dataset
       * @example 4440baa
       */
      hash?: string;
      /** @description De dataset met records */
      dataset?: components["schemas"]["progressie_kaart_dataset"][];
    };
    progressie_kaart_dataset: {
      /**
       * Format: int32
       * @description Database ID van het record
       * @example 12871
       */
      ID?: number;
      /**
       * Format: int16
       * @description Volgorde van weergave
       * @example 1
       */
      VOLGORDE?: number;
      /**
       * Format: int32
       * @description In welke leerfase zit deze competentie. Verwijzing naar ref_types
       * @example 1
       */
      LEERFASE_ID?: number;
      /**
       * @description Omschrijving uit de types tabel
       * @example VVO
       */
      LEERFASE?: string;
      /**
       * @description Volgnummer
       * @example 3.4
       */
      BLOK?: string;
      /**
       * Format: int32
       * @description Verwijzing naar bovenliggend record van boom structuur
       * @example 300
       */
      BLOK_ID?: number;
      /**
       * @description Volledige omschrijving van de compententie
       * @example Uitstap procedure
       */
      ONDERWERP?: string;
      /**
       * @description Verwijzing naar de volledige documentie
       * @example VVO1.14
       */
      DOCUMENTATIE?: string;
      /**
       * @description Is dit record gemarkeerd als verwijderd?
       * @example 0
       */
      VERWIJDERD?: boolean;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database
       * @example 2019-05-01 16:42:00
       */
      LAATSTE_AANPASSING?: string;
      /**
       * Format: int32
       * @description ID van progressie record
       * @example 12871
       */
      PROGRESSIE_ID?: number;
      /**
       * Format: date-time
       * @description Tijdstempel wanneer record is toegevoegd
       * @example 2018-02-28T15:04:40Z
       */
      INGEVOERD?: number;
      /**
       * @description De volledige naam van de instrcuteur die de competentie heeft toegevoegd
       * @example Lowieke de Vos
       */
      INSTRUCTEUR_NAAM?: string;
      /**
       * @description Opmerking over de behaalde competentie
       * @example Heeft aangetoond dat de vaardigheden volledig beheerst
       */
      OPMERKINGEN?: string;
    };
    progressie_boom: {
      /**
       * Format: int32
       * @description In welke leerfase zit deze competentie. Verwijzing naar ref_types
       * @example 1
       */
      LEERFASE_ID?: number;
      /**
       * Format: int32
       * @description Comptententie ID
       * @example 12871
       */
      COMPETENTIE_ID?: number;
      /**
       * Format: int32
       * @description Verwijzing naar bovenliggend record van boom structuur
       * @example 300
       */
      BLOK_ID?: number;
      /**
       * @description Volgnummer
       * @example 3.4
       */
      BLOK?: string;
      /**
       * @description Volledige omschrijving van de compententie
       * @example Uitstap procedure
       */
      ONDERWERP?: string;
      /**
       * @description Verwijzing naar de volledige documentie
       * @example VVO1.14
       */
      DOCUMENTATIE?: string;
      /**
       * Format: int32
       * @description ID van progressie record
       * @example 12871
       */
      PROGRESSIE_ID?: number;
      /**
       * Format: int32
       * @description Is comptententie behaald, 0 = niet behaald, 1 = gedeeltelijk van onderliggende, 2 = gehaald, ook alle onderliggende
       * @example 1
       */
      IS_BEHAALD?: number;
      /**
       * Format: date-time
       * @description Tijdstempel wanneer record is toegevoegd
       * @example 2018-02-28T15:04:40Z
       */
      INGEVOERD?: string;
      /**
       * @description De volledige naam van de instrcuteur die de competentie heeft toegevoegd
       * @example Lowieke de Vos
       */
      INSTRUCTEUR_NAAM?: string;
      /**
       * @description Opmerking over de behaalde competentie
       * @example Heeft aangetoond dat de vaardigheden volledig beheerst
       */
      OPMERKINGEN?: string;
      children?: components["schemas"]["progressie_boom"][];
    };
  };
}


