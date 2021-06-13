import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {DashboardPageComponent} from './pages/dashboard/dashboard-page.component';
import {HelpPageComponent} from './pages/help/help-page.component';
import {ProfilePageComponent} from './pages/profile/profile-page.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {LoginPageComponent} from './pages/login-page/login-page.component';

import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {faChartPie, faKey, faPlane, faUser} from '@fortawesome/free-solid-svg-icons';
import {faClipboardList} from "@fortawesome/free-solid-svg-icons/faClipboardList";
import {StartlijstGridComponent} from "./pages/startlijst-grid/startlijst-grid.component";
import {VliegtuigenGridComponent} from './pages/vliegtuigen-grid/vliegtuigen-grid.component';

export interface CustomRoute extends Route {
  excluded: boolean;
  icon: IconDefinition;
  text: string;
}

export const routes: CustomRoute[] = [
  {path: '', pathMatch: 'full', redirectTo: 'dashboard', excluded: true, icon: faUser, text: 'EXCLUDED'},
  {path: 'dashboard', component: DashboardPageComponent, excluded: false, icon: faChartPie, text: 'Dashboard'},
  {path: 'startlijst', component: StartlijstGridComponent, excluded: false, icon: faClipboardList, text: 'Startlijst'},
  {path: 'vliegtuigen', component: VliegtuigenGridComponent, excluded: false, icon: faPlane, text: 'Vliegtuigen'},
  {path: 'login', component: LoginPageComponent, excluded: true, icon: faKey, text: 'Help'},
  {
    path: 'profiles', component: ProfilePageComponent, excluded: false, icon: faUser, text: 'Profile'
  },
  {path: '**', component: NotFoundComponent, excluded: true, icon: faUser, text: 'EXCLUDED'},

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingModule { }
