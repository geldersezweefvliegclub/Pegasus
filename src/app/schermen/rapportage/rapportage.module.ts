import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RapportSchermComponent } from './rapport-scherm/rapport-scherm.component';
import {SharedModule} from "../../shared/shared.module";
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {TypesPageComponent} from "../types/types-page/types-page.component";



@NgModule({
  declarations: [
    RapportSchermComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,

    RouterModule.forChild([
      {
        path: '',
        component: RapportSchermComponent
      }
    ]),
  ]
})
export class RapportageModule { }
