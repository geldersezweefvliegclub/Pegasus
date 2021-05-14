import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomePageComponent} from './pages/home/home-page.component';
import {Route} from '@angular/router/'
import {faTh, faUser} from '@fortawesome/free-solid-svg-icons';
import {IconDefinition} from '@fortawesome/free-solid-svg-icons'
import {FooterComponent} from './components/footer/footer.component';
import {LoginPageComponent} from './pages/login-page/login-page.component';

export interface RouteInfo extends Route {
  path: string;
  title: string;
  icon: IconDefinition;
  class: string;
  excluded: boolean;
}

export const ROUTES: RouteInfo[] = [
  {path: '', pathMatch: 'full', redirectTo: 'home', title: 'EXCLUDED', icon: faUser, class: '', excluded: true},
  {path: 'home', component: HomePageComponent, title: 'Dashboard', icon: faTh, class: '', excluded: false},
  {path: 'login', component: LoginPageComponent, title: 'Test', icon: faUser, class: '', excluded: true},
];

@NgModule({
  imports: [RouterModule.forRoot(ROUTES)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
