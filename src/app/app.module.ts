import {AgmCoreModule} from '@agm/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Route, RouterModule} from '@angular/router';
import {AppComponent} from './app.component';

import {PagesModule} from './pages/pages.module';
import {SharedModule} from './shared/shared.module';

import {BasicTableComponent} from './pages/tables/basic-table/basic-table.component';
import {ProfileComponent} from './pages/profile/profile.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';

// main layout
import {HelpComponent} from './pages/help/help.component';
import {NavigationComponent} from './main-layout/navigation/navigation.component';
import {FooterComponent} from './main-layout/footer/footer.component';

export interface CustomRoute extends Route {
  excluded: boolean,
  icon: string,
  text: string,
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
  declarations: [
    AppComponent,
    NavigationComponent,
    FooterComponent
  ],
  imports: [
    AgmCoreModule.forRoot({
      apiKey: ''
    }),
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {relativeLinkResolution: 'legacy'}),
    FormsModule,
    SharedModule,
    PagesModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
}
