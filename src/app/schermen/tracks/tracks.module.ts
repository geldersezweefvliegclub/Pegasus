import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {TracksGridComponent} from "./tracks-grid/tracks-grid.component";

@NgModule({
  declarations: [
    TracksGridComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    SharedModule,

    RouterModule.forChild([
      {
        path: '',
        component: TracksGridComponent
      }
    ])
  ],
  exports: [
    TracksGridComponent
  ]
})

export class TracksModule { }
