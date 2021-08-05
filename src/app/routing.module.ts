import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {DashboardPageComponent} from './pages/dashboard/dashboard-page.component';
import {ProfielPageComponent} from './pages/profiel/profiel-page.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {LoginPageComponent} from './pages/login-page/login-page.component';

import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {
  faBookReader,
  faCalendarAlt,
  faCalendarDay,
  faChartPie,
  faKey,
  faPlane,
  faUser,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import {faClipboardList} from '@fortawesome/free-solid-svg-icons/faClipboardList';
import {StartlijstGridComponent} from './pages/startlijst-grid/startlijst-grid.component';
import {VliegtuigenGridComponent} from './pages/vliegtuigen-grid/vliegtuigen-grid.component';
import {DaginfoComponent} from './pages/daginfo/daginfo.component';
import {LedenGridComponent} from './pages/leden-grid/leden-grid.component';
import {VliegtuigLogboekComponent} from './pages/vliegtuig-logboek/vliegtuig-logboek.component';
import {RoosterPageComponent} from './pages/rooster-page/rooster-page.component';
import {TracksGridComponent} from "./pages/tracks-grid/tracks-grid.component";
import {TestPageComponent} from "./pages/test-page/test-page.component";

export interface CustomRoute extends Route {
  excluded: boolean;
  icon: IconDefinition;
  text: string;
}

export const routes: CustomRoute[] = [
  {path: '', pathMatch: 'full', redirectTo: 'dashboard', excluded: true, icon: faUser, text: 'EXCLUDED'},
  {path: 'dashboard', component: DashboardPageComponent, excluded: false, icon: faChartPie, text: 'Dashboard'},
  {path: 'tracks', component: TracksGridComponent, excluded: false, icon: faBookReader, text: 'Tracks'},
  {path: 'daginfo', component: DaginfoComponent, excluded: false, icon: faCalendarAlt, text: 'Dag info'},
  {path: 'startlijst', component: StartlijstGridComponent, excluded: false, icon: faClipboardList, text: 'Startlijst'},
  {path: 'leden', component: LedenGridComponent, excluded: false, icon: faUsers, text: 'Ledenlijst'},
  {path: 'vlogboek', component: VliegtuigLogboekComponent, excluded: true, icon: faPlane, text: 'Vliegtuig logboek'},
  {path: 'vliegtuigen', component: VliegtuigenGridComponent, excluded: false, icon: faPlane, text: 'Vliegtuigen'},
  {path: 'login', component: LoginPageComponent, excluded: true, icon: faKey, text: 'Help'},
  {path: 'profiel', component: ProfielPageComponent, excluded: false, icon: faUser, text: 'Profiel'},
  {path: 'rooster', component: RoosterPageComponent, excluded: false, icon: faCalendarDay, text: 'Rooster'},
  {path: 'test', component: TestPageComponent, excluded: false, icon: faChartPie, text: 'test'},
  {path: '**', component: NotFoundComponent, excluded: true, icon: faUser, text: 'EXCLUDED'},

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingModule {
}
