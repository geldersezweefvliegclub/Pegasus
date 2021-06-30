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
import { StartlijstGridComponent } from './startlijst-grid/startlijst-grid.component';
import {NgbDatepickerModule, NgbTypeaheadModule} from "@ng-bootstrap/ng-bootstrap";
import { VliegerRenderComponent } from './startlijst-grid/vlieger-render/vlieger-render.component';
import { InzittendeRenderComponent } from './startlijst-grid/inzittende-render/inzittende-render.component';
import { StarttijdRenderComponent } from './startlijst-grid/starttijd-render/starttijd-render.component';
import { LandingstijdRenderComponent } from './startlijst-grid/landingstijd-render/landingstijd-render.component';
import { TijdInvoerComponent } from '../shared/components/editors/tijd-invoer/tijd-invoer.component';
import {CustomFormsModule} from 'ng2-validation';

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
        NgbDatepickerModule,
        NgbTypeaheadModule,
        CustomFormsModule
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
    LedenGridComponent,
    StartlijstGridComponent,
    VliegerRenderComponent,
    InzittendeRenderComponent,
    StarttijdRenderComponent,
    LandingstijdRenderComponent,
    TijdInvoerComponent
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
