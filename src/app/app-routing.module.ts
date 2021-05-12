import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomePageComponent} from './pages/home/home-page.component';
import {Route} from '@angular/router/'
import {faUser} from '@fortawesome/free-solid-svg-icons';
import {IconDefinition} from '@fortawesome/free-solid-svg-icons'
import {FooterComponent} from './components/footer/footer.component';

export interface RouteInfo extends Route {
  path: string;
  title: string;
  icon: IconDefinition;
  class: string;
  excluded: boolean;
}

export const ROUTES: RouteInfo[] = [
  {path: '', pathMatch: 'full', redirectTo: 'home', title: 'EXCLUDED', icon: faUser, class: '', excluded: true},
  {path: 'home', component: HomePageComponent, title: 'Dashboard', icon: faUser, class: '', excluded: false},
  {path: 'user-profile', component: FooterComponent, title: 'User Profile', icon: faUser, class: '', excluded: false},
  {path: 'table-list', component: FooterComponent, title: 'Table List', icon: faUser, class: '', excluded: false},
  {path: 'typography', component: FooterComponent, title: 'Typography', icon: faUser, class: '', excluded: false},
  {path: 'icons', component: FooterComponent, title: 'Icons', icon: faUser, class: '', excluded: false},
  {path: 'maps', component: FooterComponent, title: 'Maps', icon: faUser, class: '', excluded: false},
  {path: 'notifications', component: FooterComponent, title: 'Notifications', icon: faUser, class: '', excluded: false},
  {
    path: 'upgrade',
    component: FooterComponent,
    title: 'Upgrade to PRO',
    icon: faUser,
    class: 'active-pro',
    excluded: false
  },
];

@NgModule({
  imports: [RouterModule.forRoot(ROUTES)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
