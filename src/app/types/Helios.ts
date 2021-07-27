import {components as loginComponents} from './Login';
import {components as vliegtuigenComponents} from './Vliegtuigen';
import {components as ledenComponents} from './Leden';
import {components as startlijstComponents} from './Startlijst';
import {components as aanwezigVliegtuigenComponents} from './aanwezigVliegtuigen';
import {components as aanwezigLedenComponents} from './aanwezigLeden';
import {components as DaginfoComponents} from './daginfo';
import {components as typesComponents} from './Types';
import {components as progressieComponents} from './Progressie';
import {components as roosterComponent} from './Rooster';

export type HeliosUserinfo = loginComponents['schemas']['Userinfo'];

export type HeliosAanwezigVliegtuigen = aanwezigVliegtuigenComponents['schemas']['view_aanwezig_vliegtuigen'];
export type HeliosAanwezigVliegtuigenDataset = aanwezigVliegtuigenComponents['schemas']['view_aanwezig_vliegtuigen_dataset'];

export type HeliosAanwezigLeden = aanwezigLedenComponents['schemas']['view_aanwezig_leden'];
export type HeliosAanwezigLedenDataset = aanwezigLedenComponents['schemas']['view_aanwezig_leden_dataset'];

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
export type HeliosLid = ledenComponents['schemas']['ref_leden_in'];

export type HeliosDagInfoDagen = DaginfoComponents['schemas']['view_daginfo'];
export type HeliosDagInfosDataset = DaginfoComponents['schemas']['view_daginfo_dataset'];
export type HeliosDagInfo = DaginfoComponents['schemas']['oper_daginfo'];

export type HeliosType = typesComponents['schemas']['ref_types_in']
export type HeliosTypes = typesComponents['schemas']['view_types']

export type HeliosProgressie = progressieComponents['schemas']['ref_progressie_in']
export type HeliosBehaaldeProgressie = progressieComponents['schemas']['view_progressie']
export type HeliosBehaaldeProgressieDataset = progressieComponents['schemas']['view_progressie_dataset']
export type HeliosProgressieBoom = progressieComponents['schemas']['progressie_boom']
export type HeliosProgressieKaart = progressieComponents['schemas']['progressie_kaart']
export type HeliosProgressieKaartDataset = progressieComponents['schemas']['progressie_kaart_dataset']

export type HeliosRooster = roosterComponent['schemas']['view_rooster']
export type HeliosRoosterDataset = roosterComponent['schemas']['view_rooster_dataset']
export type HeliosRoosterDag = roosterComponent['schemas']['oper_rooster']
