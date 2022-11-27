/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/DDWV/Configuratie": {
    get: {
      responses: {
        /** OK, data succesvol opgehaald */
        200: {
          content: {
            "application/json": components["schemas"]["ddwv_config"];
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    ddwv_config: {
      /** @description Is DDWV software actief */
      DDWV?: boolean;
      /** @description Eerte DDWV dag van het seizoen */
      START?: string;
      EIND?: string;
      /** Format: int32 */
      MAX_STRIPPEN?: number;
      /** Format: int32 */
      STRIPPEN_RETOUR_OP_VLIEGDAG?: number;
      /** @description De dataset met records */
      TARIEVEN?: components["schemas"]["ddwv_tarieven"][];
      /** @description De dataset met records */
      AANSCHAF?: components["schemas"]["ddwv_bestelInfo"][];
    };
    ddwv_tarieven: {
      /**
       * @description Moment van boeken DDWV dag
       * @example 3
       */
      TIJDSTIP?: string;
      /**
       * @description Aantal strippen die afgeschrev worden
       * @example 8
       */
      EENHEDEN?: number;
    };
    ddwv_bestelInfo: {
      /**
       * @description Aantal strippen dat aangeschaft wordt
       * @example 3
       */
      EENHEDEN?: number;
      /**
       * @description Aantal Euro die van de bank afgeschreven worden
       * @example 8
       */
      BEDRAG?: number;
      /**
       * @description Kosten van de bank transactie
       * @example 1.1
       */
      KOSTEN?: number;
      /**
       * @description Omschrijving in tekst
       * @example 12 strippen, € 48.00 plus € 1.00 transactiekosten
       */
      OMSCHRIJVING?: string;
    };
  };
}

export interface operations {}

export interface external {}
