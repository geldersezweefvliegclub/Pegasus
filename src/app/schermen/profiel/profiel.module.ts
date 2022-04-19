import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {ProfielPageComponent} from "./profiel/profiel-page.component";

@NgModule({
    declarations: [
        ProfielPageComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: ProfielPageComponent
            }
        ])
    ],
    exports: [
        ProfielPageComponent
    ]
})

export class ProfielModule {
}
