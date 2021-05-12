import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { Route } from '@angular/router/'
import { faUser } from '@fortawesome/free-solid-svg-icons';
import {IconDefinition} from '@fortawesome/free-solid-svg-icons'
import { FooterComponent } from './footer/footer.component';

const routes: Routes = [
  {path: '', component: HomeComponent}
];

export interface RouteInfo extends Route {
  path: string;
  title: string;
  icon: IconDefinition;
  class: string;
}
export const ROUTES: RouteInfo[] = [
  { path: '', component: HomeComponent ,title: 'Dashboard',  icon: faUser, class: '' },
  { path: 'user-profile', component: FooterComponent, title: 'User Profile',  icon: faUser, class: '' },
  { path: 'table-list', component: FooterComponent, title: 'Table List',  icon:faUser, class: '' },
  { path: 'typography', component: FooterComponent, title: 'Typography',  icon:faUser, class: '' },
  { path: 'icons', component: FooterComponent, title: 'Icons',  icon:faUser, class: '' },
  { path: 'maps', component: FooterComponent, title: 'Maps',  icon:faUser, class: '' },
  { path: 'notifications', component: FooterComponent, title: 'Notifications',  icon:faUser, class: '' },
  { path: 'upgrade', component: FooterComponent, title: 'Upgrade to PRO',  icon: faUser, class: 'active-pro' },
];

@NgModule({
  imports: [RouterModule.forRoot(ROUTES)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
