/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/Progressie/CreateTable": {
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
  "/Progressie/CreateViews": {
    post: {
      responses: {
        /** Aangemaakt, View toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, view niet aangemaak */
        500: unknown;
      };
    };
  };
  "/Progressie/GetObject": {
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
            "application/json": components["schemas"]["ref_progressie"];
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
  "/Progressie/GetObjects": {
    get: {
      parameters: {
        query: {
          /** Database ID van het progressie record */
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
          /** Welke instruct heeft welke comptententie afgetekend */
          INSTRUCTEUR_ID?: string;
          /** Progressie van een bepaald lid */
          LID_ID?: string;
          /** Comptententie ID's in CSV formaat */
          IN?: string;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["view_progressie"];
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
  "/Progressie/ProgressieKaart": {
    get: {
      parameters: {
        query: {
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
          /** Progressiekaart van een bepaald lid */
          LID_ID?: string;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["progressie_kaart"];
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
  "/Progressie/ProgressieBoom": {
    get: {
      parameters: {
        query: {
          /** Laatste aanpassing op basis van records in dataset. Bedoeld om data verbruik te verminderen. Dataset is daarom leeg */
          LAATSTE_AANPASSING?: boolean;
          /** HASH van laatste GetObjects aanroep. Indien bij nieuwe aanroep dezelfde data bevat, dan volgt http status code 304. In geval dataset niet hetzelfde is, dan komt de nieuwe dataset terug. Ook bedoeld om dataverbruik te vermindereren. Er wordt alleen data verzonden als het nodig is. */
          HASH?: string;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
          /** Progressie boom van een bepaald lid */
          LID_ID?: string;
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
  "/Progressie/DeleteObject": {
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
  "/Progressie/RestoreObject": {
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
  "/Progressie/SaveObject": {
    put: {
      responses: {
        /** OK, data succesvol aangepast */
        200: {
          content: {
            "application/json": components["schemas"]["ref_progressie"];
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
          "application/json": components["schemas"]["ref_progressie_in"];
        };
      };
    };
    post: {
      responses: {
        /** OK, data succesvol toegevoegd */
        200: {
          content: {
            "application/json": components["schemas"]["ref_progressie"];
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
          "application/json": components["schemas"]["ref_progressie_in"];
        };
      };
    };
  };
}

export interface components {
  schemas: {
    ref_progressie_in: {
      /** Database ID van het record */
      ID?: number;
      /** Lid ID (ID uit ref_leden) */
      LID_ID?: number;
      /** Welke comptententie heeft dit lid zich eigen gemaakt. Verwijzing naar ref_competenties */
      COMPETENTIE_ID?: number;
      /** Door wie is de competentie toegevoegd voor de lid */
      INSTRUCTEUR_ID?: number;
      /** Opmerking over de behaalde competentie */
      OPMERKINGEN?: string;
    };
    ref_progressie: components["schemas"]["ref_progressie_in"] & {
      /** Tijdstempel wanneer record is toegevoegd */
      INGEVOERD?: string;
      /** Verwijzing naar eerder ingevoerde data */
      LINK_ID?: number;
      /** Is dit record gemarkeerd als verwijderd? */
      VERWIJDERD?: boolean;
      /** Tijdstempel van laaste aanpassing in de database */
      LAATSTE_AANPASSING?: string;
    };
    view_progressie_dataset: components["schemas"]["ref_progressie"] & {
      /** Fase van de vliegopleiding */
      LEERFASE?: string;
      /** Volledige omschrijving van de compententie */
      COMPETENTIE?: string;
      /** De volledige naam van het lid */
      LID_NAAM?: string;
      /** De volledige naam van de instrcuteur die de competentie heeft toegevoegd */
      INSTRUCTEUR_NAAM?: string;
    };
    view_progressie: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      /** De dataset met records */
      dataset?: components["schemas"]["view_progressie_dataset"][];
    };
    competenties_kaart: {
      /** Aantal records van de comptentie kaart */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database op de progressei tabel */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      /** De dataset met records */
      dataset?: (any & {
        /** Fase van de vliegopleiding */
        LEERFASE?: string;
      })[];
    };
    progressie_kaart: {
      /** Aantal records dat voldoet aan de criteria in de database */
      totaal?: number;
      /** Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria */
      laatste_aanpassing?: string;
      /** hash van de dataset */
      hash?: string;
      /** De dataset met records */
      dataset?: components["schemas"]["progressie_kaart_dataset"][];
    };
    progressie_kaart_dataset: {
      /** Database ID van het record */
      ID?: number;
      /** Volgorde van weergave */
      VOLGORDE?: number;
      /** In welke leerfase zit deze competentie. Verwijzing naar ref_types */
      LEERFASE_ID?: number;
      /** Omschrijving uit de types tabel */
      LEERFASE?: string;
      /** Volgnummer */
      BLOK?: string;
      /** Verwijzing naar bovenliggend record van boom structuur */
      BLOK_ID?: number;
      /** Volledige omschrijving van de compententie */
      ONDERWERP?: string;
      /** Verwijzing naar de volledige documentie */
      DOCUMENTATIE?: string;
      /** Is dit record gemarkeerd als verwijderd? */
      VERWIJDERD?: boolean;
      /** Tijdstempel van laaste aanpassing in de database */
      LAATSTE_AANPASSING?: string;
      /** ID van progressie record */
      PROGRESSIE_ID?: number;
      /** Tijdstempel wanneer record is toegevoegd */
      INGEVOERD?: number;
      /** De volledige naam van de instrcuteur die de competentie heeft toegevoegd */
      INSTRUCTEUR_NAAM?: string;
      /** Opmerking over de behaalde competentie */
      OPMERKINGEN?: string;
    };
    progressie_boom: {
      /** In welke leerfase zit deze competentie. Verwijzing naar ref_types */
      LEERFASE_ID?: number;
      /** Comptententie ID */
      COMPETENTIE_ID?: number;
      /** Verwijzing naar bovenliggend record van boom structuur */
      BLOK_ID?: number;
      /** Volgnummer */
      BLOK?: string;
      /** Volledige omschrijving van de compententie */
      ONDERWERP?: string;
      /** Verwijzing naar de volledige documentie */
      DOCUMENTATIE?: string;
      /** ID van progressie record */
      PROGRESSIE_ID?: number;
      /** Is comptententie behaald, 0 = niet behaald, 1 = gedeeltelijk van onderliggende, 2 = gehaald, ook alle onderliggende */
      IS_BEHAALD?: number;
      /** Tijdstempel wanneer record is toegevoegd */
      INGEVOERD?: string;
      /** De volledige naam van de instrcuteur die de competentie heeft toegevoegd */
      INSTRUCTEUR_NAAM?: string;
      /** Opmerking over de behaalde competentie */
      OPMERKINGEN?: string;
      children?: components["schemas"]["progressie_boom"][];
    };
  };
}

export interface operations {}
