/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/Leden/CreateTable": {
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
  "/Leden/CreateViews": {
    post: {
      responses: {
        /** Aangemaakt, View toegevoegd */
        201: unknown;
        /** Data verwerkingsfout, view niet aangemaak */
        500: unknown;
      };
    };
  };
  "/Leden/GetObject": {
    get: {
      parameters: {
        query: {
          /** Database ID van het lid record */
          ID: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["ref_leden"];
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
  "/Leden/GetObjects": {
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
          /** Sortering van de velden in ORDER BY formaat. Default = NAAM */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query */
          MAX?: number;
          /** Eerste record in de dataset. Gebruikt in LIMIT query */
          START?: number;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
          /** Zoek in de NAAM, TELEFOON, MOBIEL, NOODNUMMER, EMAIL */
          SELECTIE?: string;
          /** Meerdere lid database IDs in CSV formaat */
          IN?: string;
          /** Zoek op een of meerder lid types. Types als CSV formaat */
          TYPES?: string;
          /** Wanneer 'true', toon alleen de leden */
          CLUBLEDEN?: boolean;
          /** Wanneer 'true', toon alleen de instructeurs */
          INSTRUCTEURS?: boolean;
          /** Wanneer 'true', toon alleen de DDWV crew */
          DDWV_CREW?: boolean;
          /** Wanneer 'true', toon alleen de lieristen */
          LIERISTEN?: boolean;
          /** Wanneer 'true', toon alleen de lieristen in opleiding */
          LIO?: boolean;
          /** Wanneer 'true', toon alleen de startleiders */
          STARTLEIDERS?: boolean;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["view_leden"];
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
  "/Leden/DeleteObject": {
    delete: {
      parameters: {
        query: {
          /** Database ID van het lid record. Meerdere ID's in CSV formaat */
          ID: string;
          /** Controleer of record bestaat voordat het verwijderd wordt. Default = true */
          VERIFICATIE?: boolean;
        };
      };
      responses: {
        /** Lid verwijderd */
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
  "/Leden/RestoreObject": {
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
  "/Leden/UploadAvatar": {
    post: {
      parameters: {
        query: {
          /** Database ID van het lid record */
          ID: number;
          /** Afbeelding ('gif','jpg','jpe','jpeg','png') */
          FILE: string;
        };
      };
      responses: {
        /** OK, avatar succesvol opgeslagen */
        200: {
          content: {
            "application/json": string;
          };
        };
        /** Lid ID niet gevonden */
        404: unknown;
        /** Methode niet toegestaan, input validatie error */
        405: unknown;
        /** Ongeldige bestand extentie */
        422: unknown;
        /** Data verwerkingsfout, bijv onjuiste veldwaarde (string ipv integer) */
        500: unknown;
      };
    };
  };
  "/Leden/SaveObject": {
    put: {
      responses: {
        /** OK, data succesvol aangepast */
        200: {
          content: {
            "application/json": components["schemas"]["ref_leden"];
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
      /** lid data */
      requestBody: {
        content: {
          "application/json": components["schemas"]["ref_leden_in"];
        };
      };
    };
    post: {
      responses: {
        /** OK, data succesvol toegevoegd */
        200: {
          content: {
            "application/json": components["schemas"]["ref_leden"];
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
      /** lid data */
      requestBody: {
        content: {
          "application/json": components["schemas"]["ref_leden_in"];
        };
      };
    };
  };
  "/Leden/vCard": {
    get: {
      parameters: {
        query: {
          /** Database ID van het lid record */
          ID: number;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["vCard"];
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
  "/Leden/vCards": {
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
          /** Sortering van de velden in ORDER BY formaat. Default = NAAM */
          SORT?: string;
          /** Maximum aantal records in de dataset. Gebruikt in LIMIT query */
          MAX?: number;
          /** Eerste record in de dataset. Gebruikt in LIMIT query */
          START?: number;
          /** Welke velden moet opgenomen worden in de dataset */
          VELDEN?: string;
          /** Zoek in de NAAM, TELEFOON, MOBIEL, NOODNUMMER, EMAIL */
          SELECTIE?: string;
          /** Meerdere lid database IDs in CSV formaat */
          IN?: string;
          /** Zoek op een of meerder lid types. Types als CSV formaat */
          TYPES?: string;
          /** Wanneer 'true', toon alleen de leden */
          CLUBLEDEN?: boolean;
          /** Wanneer 'true', toon alleen de instructeurs */
          INSTRUCTEURS?: boolean;
          /** Wanneer 'true', toon alleen de DDWV crew */
          DDWV_CREW?: boolean;
          /** Wanneer 'true', toon alleen de lieristen */
          LIERISTEN?: boolean;
          /** Wanneer 'true', toon alleen de lieristen in opleiding */
          LIO?: boolean;
          /** Wanneer 'true', toon alleen de startleiders */
          STARTLEIDERS?: boolean;
        };
      };
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": unknown;
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
  "/Leden/SynapseGebruiker": {
    post: {
      responses: {
        /** OK, data succesvol gesynchroniseerd */
        200: unknown;
        /** Fout in synchronisatie */
        500: unknown;
      };
      /** lid ID en wachtwoord */
      requestBody: {
        content: {
          "application/json": {
            /** @description lid ID uit de database */
            ID?: string;
            /** @description Het password van deze gebruiker */
            PASSWORD?: string;
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    ref_leden_in: {
      /**
       * Format: int32
       * @description Database ID van het lid record
       * @example 12871
       */
      ID?: number;
      /**
       * @description De volledige naam van het lid
       * @example Meindert het Paard
       */
      NAAM?: string;
      /**
       * @description De voornaam van het lid
       * @example Meindert
       */
      VOORNAAM?: string;
      /**
       * @description De tussenvoegsel van het lid
       * @example het
       */
      TUSSENVOEGSEL?: string;
      /**
       * @description De achternaam van het lid zonder tussenvoegsels
       * @example Paard
       */
      ACHTERNAAM?: string;
      /**
       * @description Het (post) adres waar het lid woont
       * @example Werf 18
       */
      ADRES?: string;
      /**
       * @description De postcode die bij het adres hoort
       * @example 7158 PP
       */
      POSTCODE?: string;
      /**
       * @description De plaatsnaam
       * @example Berkum
       */
      WOONPLAATS?: string;
      /**
       * @description Telefoon nummer van het lid
       * @example 086-1506822
       */
      TELEFOON?: string;
      /**
       * @description Mobiel telefoon nummer van het lid
       * @example 06-1025500
       */
      MOBIEL?: string;
      /**
       * @description Het telefoonnummer van een naaste, kan gebruikt worden in noodgevallen
       * @example 0112-11801
       */
      NOODNUMMER?: string;
      /**
       * @description email adres van het lid
       * @example meindert@fabeltje.com
       */
      EMAIL?: string;
      /**
       * @description url naar avatar
       * @example https://mijn.vliegclub.org/avatar.gif
       */
      AVATAR?: string;
      /**
       * @description Het lidnummer zoals dat in de leden administratie bekend is
       * @example 11139
       */
      LIDNR?: string;
      /**
       * Format: int32
       * @description Het soort lid (jeugdlid, lid, donateur). Verwijzing naar type tabel
       * @example 603
       */
      LIDTYPE_ID?: number;
      /**
       * Format: int32
       * @description De vliegstatus van het lid (DBO, solist, brevethouder), NULL indien niet van toepassing
       * @example 1901
       */
      STATUSTYPE_ID?: number;
      /**
       * Format: int32
       * @description Zusterclub lidmaatschap van lid. Nodig voor DDWV.
       * @example 1205
       */
      ZUSTERCLUB_ID?: number;
      /**
       * Format: int32
       * @description Buddy van de vlieger, leeftijdsbeleid
       * @example 811
       */
      BUDDY_ID?: number;
      /**
       * Format: int32
       * @description Buddy van de vlieger, leeftijdsbeleid
       * @example 1233
       */
      BUDDY_ID2?: number;
      /**
       * @description Mag dit lid lieren?
       * @example false
       */
      LIERIST?: boolean;
      /**
       * @description Lierist in opleiding
       * @example false
       */
      LIERIST_IO?: boolean;
      /**
       * @description Kan dit lid het startbedrijf leiden?
       * @example true
       */
      STARTLEIDER?: boolean;
      /**
       * @description Heeft dit lid een instructie bevoegdheid?
       * @example false
       */
      INSTRUCTEUR?: boolean;
      /**
       * @description Heeft dit lid een instructie bevoegdheid?
       * @example false
       */
      CIMT?: boolean;
      /**
       * @description Werkt dit lid mee in het DDWV bedrijf
       * @example false
       */
      DDWV_CREW?: boolean;
      /**
       * @description Is dit lid de beheerder van het DDWV bedrijf, heeft toegang tot DDWV gerelateede data
       * @example true
       */
      DDWV_BEHEERDER?: boolean;
      /**
       * @description Is dit lid de beheerder van deze omgeving, heeft toegang tot alles
       * @example true
       */
      BEHEERDER?: boolean;
      /**
       * @description Dit account wordt gebruikt om starts in de start toren in te voeren
       * @example false
       */
      STARTTOREN?: boolean;
      /**
       * @description Is dit lid  belast met het maken van roosters
       * @example false
       */
      ROOSTER?: boolean;
      /**
       * @description Is dit lid ook een sleepvlieger
       * @example false
       */
      SLEEPVLIEGER?: boolean;
      /**
       * @description Moet clubblad per post verstuurd worden
       * @example true
       */
      CLUBBLAD_POST?: boolean;
      /**
       * @description Is zelfstart afgekocht
       * @example true
       */
      ZELFSTART_ABONNEMENT?: boolean;
      /**
       * @description Verstuur het dagrapport per email
       * @example false
       */
      EMAIL_DAGINFO?: boolean;
      /**
       * @description Heeft lid toegang tot alle starts / logboeken voor rapportage
       * @example true
       */
      RAPPORTEUR?: boolean;
      /**
       * @description Wordt dit lid ingedeeld om gasten te vliegen
       * @example true
       */
      GASTENVLIEGER?: boolean;
      /**
       * @description Techniscus heeft aftekenbevoegdheid
       * @example true
       */
      TECHNICUS?: boolean;
      /**
       * Format: date
       * @description Verloopdatum van het medical
       * @example 2022-01-16
       */
      MEDICAL?: string;
      /**
       * Format: date
       * @description Geboorte datum van het lid
       * @example 1932-01-16
       */
      GEBOORTE_DATUM?: string;
      /**
       * @description De inlognaam van het lid
       * @example mpaard
       */
      INLOGNAAM?: string;
      /**
       * @description Het geheime password, bij ophalen van data altijd "****". Wachtwoord wordt als hash opgeslagen in de database
       * @example 123456
       */
      WACHTWOORD?: string;
      /**
       * @description Wachtwoord in Helios hash formaat. Data wordt direct in database opgeslagen zonder encryptie, dat is namelijk al gebeurd. Alleen van toepassing voor SaveObject, komt dus niet terug in GetObject of GetObjects
       * @example 123456
       */
      WACHTWOORD_HASH?: string;
      /**
       * @description 2Factor authenticatie voor deze gebruiker
       * @example true
       */
      AUTH?: boolean;
      /**
       * @description Heef het lid een startverbod?
       * @example false
       */
      STARTVERBOD?: boolean;
      /**
       * @description Heeft het lid het lidmaatschap opgezegd
       * @example true
       */
      OPGEZEGD?: boolean;
      /**
       * @description Staat privacy mode (AVG / GDPR) uit/aan
       * @example true
       */
      PRIVACY?: boolean;
      /**
       * @description Het serienummner van sleutel 1 (GeZC)
       * @example 12372
       */
      SLEUTEL1?: string;
      /**
       * @description Het serienummner van sleutel 2 (SNZT)
       * @example 88AB021EC04
       */
      SLEUTEL2?: string;
      /**
       * @description Beroep van het lid
       * @example Student bedrijgfysica
       */
      BEROEP?: string;
      /**
       * @description Het lidmaatschapsnummer van de KNVVL
       * @example 158700
       */
      KNVVL_LIDNUMMER?: string;
      /**
       * @description Het nummer van het brevet
       * @example A78BB001
       */
      BREVET_NUMMER?: string;
      /**
       * @description Extra text om opmerkingen toe te voegen
       * @example Voorkeur om 's morgens lierdienst te doen
       */
      OPMERKINGEN?: string;
      /**
       * @description DDWV tegoed
       * @example 22.05
       */
      TEGOED?: number;
    };
    ref_leden: components["schemas"]["ref_leden_in"] & {
      /**
       * @description Readonly, **** voor gewone gebruikers, URL om QRcode op te halen voor beheerders
       * @example 123456
       */
      SECRET?: string;
      /**
       * @description Is dit record gemarkeerd als verwijderd?
       * @example 0
       */
      VERWIJDERD?: boolean;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database
       * @example 2020-09-01 20:21:33
       */
      LAATSTE_AANPASSING?: string;
    };
    view_leden_dataset: components["schemas"]["ref_leden"] & {
      /**
       * @description Heeft lid PAX competentie behaald
       * @example true
       */
      PAX?: boolean;
      /**
       * @description Lidtype in text
       * @example Jeugdlid
       */
      LIDTYPE?: string;
      /**
       * @description Lidtype externe referentie
       * @example JL
       */
      LIDTYPE_REF?: string;
      /**
       * @description Vliegstatus, zoals DBO, Solist of Brevethouder
       * @example Brevethouder
       */
      STATUS?: string;
      /**
       * @description Naam van de zusterclub
       * @example De buren
       */
      ZUSTERCLUB?: string;
      /**
       * @description Naam van de buddy
       * @example Mr Broekhuis
       */
      BUDDY?: string;
      /**
       * @description Naam van de buddy
       * @example Mevr Bonensteek
       */
      BUDDY2?: string;
    };
    view_leden: {
      /**
       * Format: int32
       * @description Aantal records dat voldoet aan de criteria in de database
       * @example 287
       */
      totaal?: number;
      /**
       * Format: date-time
       * @description Tijdstempel van laaste aanpassing in de database van de records dat voldoet aan de criteria
       * @example 2016-08-30 17:04:07
       */
      laatste_aanpassing?: string;
      /**
       * @description hash van de dataset
       * @example 1190732
       */
      hash?: string;
      /** @description De dataset met records */
      dataset?: components["schemas"]["view_leden_dataset"][];
    };
    vCard: {
      /**
       * @description Databse record ID
       * @example 10456
       */
      id?: string;
      /**
       * @description Naam van contact
       * @example Willem Bever
       */
      naam?: string;
      /**
       * @description uniek identificatie (versleuteld ID)
       * @example =YDM3AjM6QUSklGT.vcf
       */
      uri?: string;
      /**
       * @description checksum
       * @example 3834844087
       */
      etag?: string;
      /**
       * @description checksum
       * @example 1670860245
       */
      lastmodified?: string;
      /** @description de vCard */
      carddata?: string;
    };
  };
}


