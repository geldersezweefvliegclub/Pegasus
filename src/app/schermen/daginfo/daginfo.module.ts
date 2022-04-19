import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {DaginfoComponent} from "./daginfo/daginfo.component";
import {ComposeMeteoComponent} from "./compose-meteo/compose-meteo.component";
import {ComposeBedrijfComponent} from "./compose-bedrijf/compose-bedrijf.component";
import {NgSelectModule} from "@ng-select/ng-select";

@NgModule({
  declarations: [
    DaginfoComponent,
    ComposeMeteoComponent,
    ComposeBedrijfComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    NgSelectModule,
    SharedModule,

    RouterModule.forChild([
      {
        path: '',
        component: DaginfoComponent
      }
    ])
  ],
  exports: [
    DaginfoComponent
  ]
})

export class DaginfoModule { }
