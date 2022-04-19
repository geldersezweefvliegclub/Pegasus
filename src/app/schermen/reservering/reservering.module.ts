import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {ReserveringPageComponent} from "./reservering-page/reservering-page.component";
import {KistSelectieComponent} from "./kist-selectie/kist-selectie.component";


@NgModule({
  declarations: [
    ReserveringPageComponent,
      KistSelectieComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    SharedModule,

    RouterModule.forChild([
      {
        path: '',
        component: ReserveringPageComponent
      }
    ])
  ],
  exports: [
    ReserveringPageComponent
  ]
})

export class ReserveringModule { }
