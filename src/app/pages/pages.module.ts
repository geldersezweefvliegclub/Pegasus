import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {SharedModule} from '../shared/shared.module';
import {IconCardComponent} from '../shared/components/icon-card/icon-card.component';
import {DashboardPageComponent} from './dashboard/dashboard-page.component';
import {ProfilePageComponent} from './profile/profile-page.component';
import {HelpPageComponent} from './help/help-page.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {LoginPageComponent} from './login-page/login-page.component';
import {CodeInputModule} from 'angular-code-input';
import {VliegtuigenGridComponent} from './vliegtuigen-grid/vliegtuigen-grid.component';
import {ZitplaatsRenderComponent} from './vliegtuigen-grid/zitplaats-render/zitplaats-render.component';
import {LedenGridComponent} from './leden-grid/leden-grid.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    CodeInputModule,
    FontAwesomeModule,
  ],
  declarations: [
    IconCardComponent,
    DashboardPageComponent,
    ProfilePageComponent,
    HelpPageComponent,
    NotFoundComponent,
    LoginPageComponent,
    VliegtuigenGridComponent,
    ZitplaatsRenderComponent,
    LedenGridComponent
  ],
  exports: [
    IconCardComponent,
    DashboardPageComponent,
    CodeInputModule
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class PagesModule {
}
