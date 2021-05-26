import {components as loginComponents} from './Login';
import {components as vliegtuigenComponents} from './Vliegtuigen';
import {components as typesComponents} from './Types';

export type HeliosUserinfo = loginComponents['schemas']['Userinfo'];

export type HeliosVliegtuigen = vliegtuigenComponents['schemas']['view_vliegtuigen'];
export type HeliosVliegtuig = vliegtuigenComponents['schemas']['ref_vliegtuigen_in']

export type HeliosType = typesComponents['schemas']['ref_types_in']
