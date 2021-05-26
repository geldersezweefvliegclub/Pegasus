import { components as loginComponents} from './Login';
import { components as vliegtuigenComponents} from './Vliegtuigen';

export type HeliosUserinfo = loginComponents["schemas"]["Userinfo"];

export type HeliosVliegtuigen = vliegtuigenComponents["schemas"]["view_vliegtuigen"];
export type HeliosVliegtuig = vliegtuigenComponents["schemas"]["ref_vliegtuigen_in"]
