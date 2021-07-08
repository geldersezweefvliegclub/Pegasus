import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {DashboardPageComponent} from './pages/dashboard/dashboard-page.component';
import {ProfilePageComponent} from './pages/profile/profile-page.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {LoginPageComponent} from './pages/login-page/login-page.component';

import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {faCalendarAlt, faChartPie, faKey, faPlane, faUser, faUsers} from '@fortawesome/free-solid-svg-icons';
import {faClipboardList} from '@fortawesome/free-solid-svg-icons/faClipboardList';
import {StartlijstGridComponent} from './pages/startlijst-grid/startlijst-grid.component';
import {VliegtuigenGridComponent} from './pages/vliegtuigen-grid/vliegtuigen-grid.component';
import {DaginfoComponent} from "./pages/daginfo/daginfo.component";
import {LedenGridComponent} from "./pages/leden-grid/leden-grid.component";

export interface CustomRoute extends Route {
  excluded: boolean;
  icon: IconDefinition;
  text: string;
  calendar: boolean;
}

export const routes: CustomRoute[] = [
  {path: '', pathMatch: 'full', redirectTo: 'dashboard', excluded: true, icon: faUser, text: 'EXCLUDED', calendar: false},
  {path: 'dashboard', component: DashboardPageComponent, excluded: false, icon: faChartPie, text: 'Dashboard', calendar: false},
  {path: 'daginfo', component: DaginfoComponent, excluded: false, icon: faCalendarAlt, text: 'Dag info', calendar: true},
  {path: 'startlijst', component: StartlijstGridComponent, excluded: false, icon: faClipboardList, text: 'Startlijst', calendar: true},
  {path: 'leden', component: LedenGridComponent, excluded: false, icon: faUsers, text: 'Ledenlijst', calendar: true},
  {path: 'vliegtuigen', component: VliegtuigenGridComponent, excluded: false, icon: faPlane, text: 'Vliegtuigen', calendar: false},
  {path: 'login', component: LoginPageComponent, excluded: true, icon: faKey, text: 'Help', calendar: false},
  {
    path: 'profiles', component: ProfilePageComponent, excluded: false, icon: faUser, text: 'Profile', calendar: false
  },
  {path: '**', component: NotFoundComponent, excluded: true, icon: faUser, text: 'EXCLUDED', calendar: false},

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingModule { }
