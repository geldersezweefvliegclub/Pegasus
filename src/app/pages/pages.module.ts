import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {SharedModule} from '../shared/shared.module';
import {BasicTableComponent} from './tables/basic-table/basic-table.component';
import {StatsCardComponent} from '../shared/components/stats-card/stats-card.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {ProfileComponent} from './profile/profile.component';
import {HelpComponent} from './help/help.component';
import {NotFoundComponent} from './not-found/not-found.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
  ],
  declarations: [
    BasicTableComponent,
    StatsCardComponent,
    DashboardComponent,
    ProfileComponent,
    HelpComponent,
    NotFoundComponent
  ],
  exports: [
    BasicTableComponent,
    StatsCardComponent,
    DashboardComponent
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class PagesModule { }
