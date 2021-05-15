import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {HelpComponent} from './pages/help/help.component';
import {ProfileComponent} from './pages/profile/profile.component';
import {BasicTableComponent} from './pages/tables/basic-table/basic-table.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';

export interface CustomRoute extends Route {
  excluded: boolean;
  icon: string;
  text: string;
}

export const routes: CustomRoute[] = [
  {path: '', pathMatch: 'full', redirectTo: 'dashboard/v1', excluded: true, icon: 'user', text: 'EXCLUDED'},
  {path: 'dashboard', component: DashboardComponent, excluded: false, icon: 'user', text: 'Dashboard'},
  {path: 'help', component: HelpComponent, excluded: false, icon: 'user', text: 'Help'},
  {
    path: 'profiles', component: ProfileComponent, excluded: false, icon: 'user', text: 'Profile'
  },
  {
    path: 'tables', component: BasicTableComponent, excluded: false, icon: 'user', text: 'Tables'
  },
  {path: '**', component: NotFoundComponent, excluded: true, icon: 'user', text: 'EXCLUDED'},

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingModule { }
