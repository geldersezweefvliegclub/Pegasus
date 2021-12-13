import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {DashboardPageComponent} from './pages/dashboard/dashboard-page.component';
import {ProfielPageComponent} from './pages/profiel/profiel-page.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {LoginPageComponent} from './pages/login-page/login-page.component';

import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {
  faAddressCard,
  faCalendarAlt,
  faCalendarDay,
  faChartPie,
  faKey,
  faPlane,
  faUser,
  faUsers, faWaveSquare
} from '@fortawesome/free-solid-svg-icons';
import {faClipboardList} from '@fortawesome/free-solid-svg-icons/faClipboardList';
import {StartlijstGridComponent} from './pages/startlijst-grid/startlijst-grid.component';
import {VliegtuigenGridComponent} from './pages/vliegtuigen-grid/vliegtuigen-grid.component';
import {DaginfoComponent} from './pages/daginfo/daginfo.component';
import {LedenGridComponent} from './pages/leden-grid/leden-grid.component';
import {VliegtuigLogboekComponent} from './pages/vliegtuig-logboek/vliegtuig-logboek.component';
import {RoosterPageComponent} from './pages/rooster-page/rooster-page.component';
import {TracksGridComponent} from "./pages/tracks-grid/tracks-grid.component";
import {AuditPageComponent} from "./pages/audit-page/audit-page.component";
import {ReserveringPageComponent} from "./pages/reservering-page/reservering-page.component";
import {faAvianex} from "@fortawesome/free-brands-svg-icons";

export interface CustomRoute extends Route {
  excluded: boolean;
  icon: IconDefinition;
  text: string;
  batch?: number;
}

export const routes: CustomRoute[] = [
  {path: '', pathMatch: 'full', redirectTo: 'dashboard', excluded: true, icon: faUser, text: 'EXCLUDED'},
  {path: 'dashboard', component: DashboardPageComponent, excluded: false, icon: faChartPie, text: 'Dashboard'},
  {path: 'startlijst', component: StartlijstGridComponent, excluded: false, icon: faClipboardList, text: 'Startlijst'},
  {path: 'daginfo', component: DaginfoComponent, excluded: false, icon: faCalendarAlt, text: 'Dag info'},
  {path: 'tracks', component: TracksGridComponent, excluded: false, icon: faAddressCard, text: 'Tracks'},
  {path: 'reserveringen', component: ReserveringPageComponent, excluded: false, icon: faAvianex, text: 'Kist reserveren'},
  {path: 'leden', component: LedenGridComponent, excluded: false, icon: faUsers, text: 'Ledenlijst'},
  {path: 'vlogboek', component: VliegtuigLogboekComponent, excluded: true, icon: faPlane, text: 'Vliegtuig logboek'},
  {path: 'vliegtuigen', component: VliegtuigenGridComponent, excluded: false, icon: faPlane, text: 'Vliegtuigen'},
  {path: 'login', component: LoginPageComponent, excluded: true, icon: faKey, text: 'Help'},
  {path: 'profiel', component: ProfielPageComponent, excluded: false, icon: faUser, text: 'Profiel'},
  {path: 'rooster', component: RoosterPageComponent, excluded: false, icon: faCalendarDay, text: 'Rooster'},

  {path: 'audit', component: AuditPageComponent, excluded: true, icon: faWaveSquare, text: 'Audit'},

  {path: '**', component: NotFoundComponent, excluded: true, icon: faUser, text: 'EXCLUDED'},
];


export const beheerRoutes: CustomRoute[] = [
  {path: 'audit', component: AuditPageComponent, excluded: false, icon: faWaveSquare, text: 'Audit'},
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingModule {
}
