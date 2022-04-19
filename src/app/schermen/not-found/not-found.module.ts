import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {NotFoundComponent} from "./not-found/not-found.component";


@NgModule({
    declarations: [
        NotFoundComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: NotFoundComponent
            }
        ])
    ],
    exports: [
        NotFoundComponent
    ]
})

export class NotFoundModule {
}
