import {components as loginComponents} from './Login';
import {components as vliegtuigenComponents} from './Vliegtuigen';
import {components as ledenComponents} from './Leden';
import {components as startlijstComponents} from './Startlijst';
import {components as aanwezigVliegtuigenComponents} from './aanwezigVliegtuigen';
import {components as aanwezigLedenComponents} from './aanwezigLeden';
import {components as DaginfoComponents} from './daginfo';

import {components as typesComponents} from './Types';

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

export type HeliosVliegdagen = startlijstComponents['schemas']['vliegdagen'];

export type HeliosLeden = ledenComponents['schemas']['view_leden'];
export type HeliosLedenDataset = ledenComponents['schemas']['view_leden_dataset'];
export type HeliosLid = ledenComponents['schemas']['ref_leden_in'];

export type HeliosDagInfoDagen = DaginfoComponents['schemas']['view_daginfo'];
export type HeliosDagInfosDataset = DaginfoComponents['schemas']['view_daginfo_dataset'];
export type HeliosDagInfo = DaginfoComponents['schemas']['oper_daginfo'];

export type HeliosType = typesComponents['schemas']['ref_types_in']
export type HeliosTypes = typesComponents['schemas']['view_types']