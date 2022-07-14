import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TypesPageComponent} from './types-page/types-page.component';
import {RouterModule} from "@angular/router";
import {SharedModule} from "../../shared/shared.module";
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";

@NgModule({
    declarations: [
        TypesPageComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,

        RouterModule.forChild([
            {
                path: '',
                component: TypesPageComponent
            }
        ]),
        FontAwesomeModule,
    ]
})
export class TypesModule {
}
