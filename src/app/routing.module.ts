import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {DashboardPageComponent} from './pages/dashboard/dashboard-page.component';
import {HelpPageComponent} from './pages/help/help-page.component';
import {ProfilePageComponent} from './pages/profile/profile-page.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {LoginPageComponent} from './pages/login-page/login-page.component';

export interface CustomRoute extends Route {
  excluded: boolean;
  icon: string;
  text: string;
}

export const routes: CustomRoute[] = [
  {path: '', pathMatch: 'full', redirectTo: 'dashboard', excluded: true, icon: 'user', text: 'EXCLUDED'},
  {path: 'dashboard', component: DashboardPageComponent, excluded: false, icon: 'chart-pie', text: 'Dashboard'},
  {path: 'help', component: HelpPageComponent, excluded: false, icon: 'key', text: 'Help'},
  {path: 'login', component: LoginPageComponent, excluded: true, icon: 'key', text: 'Help'},
  {
    path: 'profiles', component: ProfilePageComponent, excluded: false, icon: 'user', text: 'Profile'
  },
  {path: '**', component: NotFoundComponent, excluded: true, icon: 'user', text: 'EXCLUDED'},

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class RoutingModule { }
