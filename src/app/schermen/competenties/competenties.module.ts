import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CompetentiesPageComponent} from './competenties-page/competenties-page.component';
import {RouterModule} from "@angular/router";
import {SharedModule} from "../../shared/shared.module";
import {TreeviewModule} from "ngx-treeview";
import {FormsModule} from '@angular/forms';
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";

@NgModule({
  declarations: [
    CompetentiesPageComponent
  ],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: CompetentiesPageComponent
            }
        ]),
        TreeviewModule,
        FontAwesomeModule,
    ]
})
export class CompetentiesModule { }
