export interface PVB {
  Type: string;           // Vliegtuig type
  Lokaal: number;         // Competentie ID voor lokaal vliegen
  Overland: number;       // Competentie ID voor overland
}

export interface MenuItem {
  Titel: string;
  Url: string;
  Icon: string;
  css?: string;
}

export interface Dienst {
  Tonen: boolean;
  TypeDienst: number;
  ZelfIndelen: boolean;
}

export interface Check {
  Omschrijving: string;
  CompetentieID: number[];
}

export interface Overig {
  Omschrijving: string;
  CompetentieID: number;
}

export interface Rapport {
  MenuItem: string;
  Url: string;
}

export interface Airport {
  Latitude: number;
  Longitude: number;
}

export interface IPegasusConfig {
  url: string;
  flarm_url: string;
  privacy_url: string;
  passagiersAantekeningID: number;
  saldo_actief: boolean;
  maxZelfDienstenIndelen: number;
  maxZelfEditDagen: number;

  menuItemsNietTonen: string[];

  menuItems: MenuItem[];

  diensten: Dienst[];

  pvb: PVB[];

  checks: {
    Jaren: number[];
    Check: Check[];
  };

  overig: Overig[];

  rapporten: Rapport[];

  airport: Airport;
}