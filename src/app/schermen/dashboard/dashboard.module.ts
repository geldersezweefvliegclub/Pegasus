import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardPageComponent} from "./dasboard-page/dashboard-page.component";
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {FlexLayoutModule} from "@angular/flex-layout";


@NgModule({
  declarations: [
    DashboardPageComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    FlexLayoutModule,
    SharedModule,

    RouterModule.forChild([
      {
        path: '',
        component: DashboardPageComponent
      }
    ])
  ],
  exports: [
    DashboardPageComponent
  ]
})
export class DashboardModule { }
