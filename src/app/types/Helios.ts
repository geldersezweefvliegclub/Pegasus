import { components as heliosComponents } from './generated/HeliosJs';

// Onderstaande endpoints hebben (nog) geen schema in de Helios.js swagger, daarom nog de types uit de PHP yml
import { components as loginComponents } from './generated/Login';
import { components as ddwvComponents } from './generated/DDWV';
import { components as gastenComponents } from './generated/Gasten';

type schemas = heliosComponents['schemas'];

// Response van alle GetObjects endpoints, zie IHeliosGetObjectsResponse in Helios.js
export interface HeliosGetObjects<T> {
  totaal?: number;
  hash?: string;
  dataset?: T[];
}

// Invoer voor SaveObject. Helios.js accepteert null voor optionele velden (@IsOptional), een record uit GetObjects
// (waar lege velden null zijn) kan dus ook weer opgeslagen worden
export type HeliosInput<T> = { [K in keyof T]?: T[K] | null };

export type HeliosUserinfo = loginComponents['schemas']['Userinfo'];
export type HeliosLidData = loginComponents["schemas"]["ref_leden"];

export type HeliosConfigDDWV = ddwvComponents['schemas']['ddwv_config'];

export type HeliosAanwezigVliegtuigen = HeliosGetObjects<HeliosAanwezigVliegtuigenDataset>;
export type HeliosAanwezigVliegtuigenDataset = Partial<schemas['GetObjectsOperAanwezigVliegtuigenResponse']>;

export type HeliosAanwezigLeden = HeliosGetObjects<HeliosAanwezigLedenDataset>;
export type HeliosAanwezigLedenDataset = Partial<schemas['GetObjectsOperAanwezigLedenResponse']>;
export type HeliosAanwezigSamenvatting = Partial<schemas['AanwezigLedenSamenvattingResponse']>;

export type HeliosDocumenten = HeliosGetObjects<HeliosDocumentenDataset>;
export type HeliosDocumentenDataset = Partial<schemas['GetObjectsHeliosDocumentenResponse']>;
export type HeliosDocument = HeliosInput<schemas['CreateHeliosDocumentRequest']>;

export type HeliosVliegtuigen = HeliosGetObjects<HeliosVliegtuigenDataset>;
export type HeliosVliegtuigenDataset = Partial<schemas['GetRefVliegtuigenResponse']>;
export type HeliosVliegtuig = HeliosInput<schemas['CreateRefVliegtuigDto']>;

export type HeliosStarts = HeliosGetObjects<HeliosStartDataset>;
export type HeliosStartDataset = Partial<schemas['GetObjectsOperStartlijstResponse']>;
export type HeliosStart = HeliosInput<schemas['CreateOperStartlijstDto']>;
export type HeliosLogboek = HeliosGetObjects<HeliosLogboekDataset>;
export type HeliosLogboekDataset = Partial<schemas['GetLogboekResponse']>;
export type HeliosLogboekTotalen = Partial<schemas['GetLogboekTotalenResponse']>;
export type HeliosVliegtuigLogboek = HeliosGetObjects<HeliosVliegtuigLogboekDataset>;
export type HeliosVliegtuigLogboekDataset = Partial<schemas['GetVliegtuigLogboekResponse']>;
export type HeliosVliegtuigLogboekTotalen = Partial<schemas['GetVliegtuigLogboekTotalenResponse']>;
export type HeliosRecency = Partial<schemas['RecencyResponse']>;

export type HeliosVliegdagen = HeliosGetObjects<Partial<schemas['GetVliegDagenResponse']>>;

export type HeliosLeden = HeliosGetObjects<HeliosLedenDataset>;
export type HeliosLedenDataset = Partial<schemas['GetObjectsRefLedenResponse']>;
export type HeliosLid = HeliosInput<schemas['CreateRefLidDto']>;
export type HeliosVerjaardag = Partial<schemas['VerjaardagenResponse']>;

export type HeliosDagInfoDagen = HeliosGetObjects<HeliosDagInfosDataset>;
export type HeliosDagInfosDataset = Partial<schemas['GetObjectsOperDagInfoResponse']>;
export type HeliosDagInfo = HeliosInput<schemas['CreateOperDagInfoDto']>;

export type HeliosDagRapporten = HeliosGetObjects<HeliosDagRapportenDataset>;
export type HeliosDagRapportenDataset = Partial<schemas['GetObjectsOperDagRapportenResponse']>;
export type HeliosDagRapport = HeliosInput<schemas['CreateOperDagRapportDto']>;

export type HeliosType = Partial<schemas['GetRefTypesResponse']>;
export type HeliosTypes = HeliosGetObjects<HeliosType>;

export type HeliosTypesGroep = HeliosInput<schemas['CreateRefTypesGroepDto']>;
export type HeliosTypesGroepen = HeliosGetObjects<Partial<schemas['GetObjectsRefTypesGroepenResponse']>>;

export type HeliosCompetenties = HeliosGetObjects<HeliosCompetentiesDataset>;
export type HeliosCompetentiesDataset = Partial<schemas['GetObjectsRefCompetentiesResponse']>;
export type HeliosCompetentie = HeliosInput<schemas['CreateRefCompetentieDto']>;
export type HeliosCompetentiesBoom = Partial<schemas['CompetentiesBoomResponse']>;

export type HeliosGasten = gastenComponents['schemas']['view_gasten'];
export type HeliosGastenDataset = gastenComponents['schemas']['view_gasten_dataset'];
export type HeliosGast = gastenComponents['schemas']['oper_gast_in'];

export type HeliosProgressie = HeliosInput<schemas['CreateOperProgressieDto']>;
export type HeliosBehaaldeProgressie = HeliosGetObjects<HeliosBehaaldeProgressieDataset>;
export type HeliosBehaaldeProgressieDataset = Partial<schemas['GetObjectsOperProgressieResponse']>;
export type HeliosProgressieBoom = Partial<schemas['ProgressieKaartResponse']>;
export type HeliosProgressieKaartDataset = Partial<schemas['ProgressieKaartResponse']>;

export type HeliosRooster = HeliosGetObjects<HeliosRoosterDataset>;
export type HeliosRoosterDataset = Partial<schemas['GetObjectsOperRoosterResponse']>;
export type HeliosRoosterDag = HeliosInput<schemas['CreateOperRoosterDto']>;

export type HeliosAudit = HeliosGetObjects<HeliosAuditDataset>;
export type HeliosAuditDataset = Partial<schemas['GetObjectsAuditResponse']>;

export type HeliosTrack = HeliosInput<schemas['CreateOperTrackDto']>;
export type HeliosTracks = HeliosGetObjects<HeliosTracksDataset>;
export type HeliosTracksDataset = Partial<schemas['GetObjectsOperTracksResponse']>;

export type HeliosTransactie = HeliosInput<schemas['CreateOperTransactieDto']>;
export type HeliosTransacties = HeliosGetObjects<HeliosTransactiesDataset>;
export type HeliosTransactiesDataset = Partial<schemas['GetObjectsOperTransactiesResponse']>;

export type HeliosDienst = HeliosInput<schemas['CreateOperDienstDto']>;
export type HeliosDiensten = HeliosGetObjects<HeliosDienstenDataset>;
export type HeliosDienstenDataset = Partial<schemas['GetOperDienstenResponse']>;
export type HeliosDienstenTotaal = Partial<schemas['TotaalDienstenResponse']>;

export type HeliosReservering = HeliosInput<schemas['CreateOperReserveringDto']>;
export type HeliosReserveringen = HeliosGetObjects<HeliosReserveringenDataset>;
export type HeliosReserveringenDataset = Partial<schemas['GetObjectsOperReserveringResponse']>;

export type HeliosJournaals = HeliosGetObjects<HeliosJournaalDataset>;
export type HeliosJournaalDataset = Partial<schemas['GetObjectsOperJournaalResponse']>;
export type HeliosJournaal = HeliosInput<schemas['CreateOperJournaalDto']>;

export type HeliosFacturen = HeliosGetObjects<HeliosFacturenDataset>;
export type HeliosFacturenDataset = Partial<schemas['GetObjectsOperFacturenResponse']>;
export type HeliosFactuur = HeliosInput<schemas['CreateOperFactuurDto']>;

export type HeliosAgenda = HeliosGetObjects<HeliosAgendaDataset>;
export type HeliosAgendaDataset = Partial<schemas['GetObjectsOperAgendaResponse']>;
export type HeliosAgendaActiviteit = HeliosInput<schemas['CreateOperAgendaDto']>;
