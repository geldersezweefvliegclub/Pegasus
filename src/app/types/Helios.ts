import {components as loginComponents} from './Login';
import {components as vliegtuigenComponents} from './Vliegtuigen';
import {components as ledenComponents} from './Leden';
import {components as startlijstComponents} from './Startlijst';
import {components as aanwezigVliegtuigenComponents} from './AanwezigVliegtuigen';
import {components as aanwezigLedenComponents} from './AanwezigLeden';
import {components as DaginfoComponents} from './Daginfo';
import {components as DagRapportenComponents} from './DagRapporten';
import {components as typesComponents} from './Types';
import {components as typesGroepenComponents} from './TypesGroepen';
import {components as progressieComponents} from './Progressie';
import {components as roosterComponents} from './Rooster';
import {components as tracksComponents} from './Tracks';
import {components as transactiesComponents} from './Transacties';
import {components as dienstenComponents} from './Diensten';
import {components as competentiesComponents} from './Competenties';
import {components as auditComponents} from './Audit';
import {components as reserveringComponents} from './Reservering';
import {components as gastenComponents} from './Gasten';
import {components as documentenComponents} from './Documenten';
import {components as ddwvComponents} from './DDWV';
import {components as journaalComponents} from './Journaal';
import {components as facturenComponents} from './Facturen';
import {components as agendaComponents} from './Agenda';

export type HeliosUserinfo = loginComponents['schemas']['Userinfo'];
export type HeliosLidData = loginComponents["schemas"]["ref_leden"];

export type HeliosConfigDDWV = ddwvComponents['schemas']['ddwv_config'];

export type HeliosAanwezigVliegtuigen = aanwezigVliegtuigenComponents['schemas']['view_aanwezig_vliegtuigen'];
export type HeliosAanwezigVliegtuigenDataset = aanwezigVliegtuigenComponents['schemas']['view_aanwezig_vliegtuigen_dataset'];

export type HeliosAanwezigLeden = aanwezigLedenComponents['schemas']['view_aanwezig_leden'];
export type HeliosAanwezigLedenDataset = aanwezigLedenComponents['schemas']['view_aanwezig_leden_dataset'];
export type HeliosAanwezigSamenvatting = aanwezigLedenComponents['schemas']['samenvatting'];

export type HeliosDocumenten = documentenComponents['schemas']['view_documenten'];
export type HeliosDocumentenDataset = documentenComponents['schemas']['view_documenten_dataset'];
export type HeliosDocument = documentenComponents['schemas']['document_in'];

export type HeliosVliegtuigen = vliegtuigenComponents['schemas']['view_vliegtuigen'];
export type HeliosVliegtuigenDataset = vliegtuigenComponents['schemas']['view_vliegtuigen_dataset'];
export type HeliosVliegtuig = vliegtuigenComponents['schemas']['ref_vliegtuigen_in'];

export type HeliosStarts = startlijstComponents['schemas']['view_startlijst'];
export type HeliosStartDataset = startlijstComponents['schemas']['view_startlijst_dataset'];
export type HeliosStart = startlijstComponents['schemas']['oper_startlijst_in'];
export type HeliosLogboek = startlijstComponents['schemas']['logboek'];
export type HeliosLogboekDataset = startlijstComponents['schemas']['logboek_dataset'];
export type HeliosLogboekTotalen = startlijstComponents['schemas']['logboek_totalen'];
export type HeliosVliegtuigLogboek = startlijstComponents['schemas']['vliegtuig_logboek'];
export type HeliosVliegtuigLogboekDataset = startlijstComponents['schemas']['vliegtuig_logboek_dataset'];
export type HeliosVliegtuigLogboekTotalen = startlijstComponents['schemas']['vliegtuig_logboek_totalen'];
export type HeliosRecency = startlijstComponents['schemas']['recency'];

export type HeliosVliegdagen = startlijstComponents['schemas']['vliegdagen'];

export type HeliosLeden = ledenComponents['schemas']['view_leden'];
export type HeliosLedenDataset = ledenComponents['schemas']['view_leden_dataset'];
export type HeliosLid = ledenComponents['schemas']['ref_leden'];

export type HeliosDagInfoDagen = DaginfoComponents['schemas']['view_daginfo'];
export type HeliosDagInfosDataset = DaginfoComponents['schemas']['view_daginfo_dataset'];
export type HeliosDagInfo = DaginfoComponents['schemas']['oper_daginfo'];

export type HeliosDagRapporten = DagRapportenComponents['schemas']['view_dagrapporten'];
export type HeliosDagRapportenDataset = DagRapportenComponents['schemas']['view_dagrapporten_dataset'];
export type HeliosDagRapport = DagRapportenComponents['schemas']['oper_dagrapport_in'];

export type HeliosType = typesComponents['schemas']['ref_types_in']
export type HeliosTypes = typesComponents['schemas']['view_types']

export type HeliosTypesGroep = typesGroepenComponents['schemas']['ref_types_in']
export type HeliosTypesGroepen = typesGroepenComponents['schemas']['view_types']

export type HeliosCompetenties = competentiesComponents['schemas']['view_competenties']
export type HeliosCompetentiesDataset = competentiesComponents['schemas']['view_competenties_dataset'];
export type HeliosCompetentie = competentiesComponents['schemas']['ref_competenties_in'];

export type HeliosGasten = gastenComponents['schemas']['view_gasten']
export type HeliosGastenDataset = gastenComponents['schemas']['view_gasten_dataset'];
export type HeliosGast = gastenComponents['schemas']['oper_gast_in'];

export type HeliosProgressie = progressieComponents['schemas']['ref_progressie_in']
export type HeliosBehaaldeProgressie = progressieComponents['schemas']['view_progressie']
export type HeliosBehaaldeProgressieDataset = progressieComponents['schemas']['view_progressie_dataset']
export type HeliosProgressieBoom = progressieComponents['schemas']['progressie_boom']
export type HeliosProgressieKaart = progressieComponents['schemas']['progressie_kaart']
export type HeliosProgressieKaartDataset = progressieComponents['schemas']['progressie_kaart_dataset']

export type HeliosRooster = roosterComponents['schemas']['view_rooster']
export type HeliosRoosterDataset = roosterComponents['schemas']['view_rooster_dataset']
export type HeliosRoosterDag = roosterComponents['schemas']['oper_rooster']

export type HeliosAudit = auditComponents['schemas']['view_audit']
export type HeliosAuditDataset = auditComponents['schemas']['view_audit_dataset']

export type HeliosTrack = tracksComponents['schemas']['oper_tracks'];
export type HeliosTracks = tracksComponents['schemas']['view_tracks'];
export type HeliosTracksDataset = tracksComponents['schemas']['view_tracks_dataset'];

export type HeliosTransactie = transactiesComponents['schemas']['oper_transactie'];
export type HeliosTransacties = transactiesComponents['schemas']['view_transactie'];
export type HeliosTransactiesDataset = transactiesComponents['schemas']['view_transactie_dataset'];
export type HeliosTransactiesBanken = transactiesComponents['schemas']['banken'];

export type HeliosDienst = dienstenComponents['schemas']['oper_diensten'];
export type HeliosDiensten = dienstenComponents['schemas']['view_diensten'];
export type HeliosDienstenDataset = dienstenComponents['schemas']['view_diensten_dataset'];
export type HeliosDienstenTotaal = dienstenComponents['schemas']['diensten_totaal'];

export type HeliosReservering = reserveringComponents['schemas']['oper_reservering'];
export type HeliosReserveringen = reserveringComponents['schemas']['view_reserveringen'];
export type HeliosReserveringenDataset = reserveringComponents['schemas']['view_reserveringen_dataset'];

export type HeliosJournaals = journaalComponents['schemas']['view_journaal'];
export type HeliosJournaalDataset = journaalComponents['schemas']['view_journaal_dataset'];
export type HeliosJournaal = journaalComponents['schemas']['oper_journaal_in'];

export type HeliosFacturen = facturenComponents['schemas']['view_facturen'];
export type HeliosFacturenDataset = facturenComponents['schemas']['view_facturen_dataset'];
export type HeliosFactuur = facturenComponents['schemas']['oper_factuur_in'];

export type HeliosAgendas = agendaComponents['schemas']['view_agenda'];
export type HeliosAgendaDataset = agendaComponents['schemas']['view_agenda_dataset'];
export type HeliosAgenda = agendaComponents['schemas']['oper_agenda_in'];