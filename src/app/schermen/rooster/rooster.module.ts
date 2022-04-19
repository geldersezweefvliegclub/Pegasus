import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {RoosterPageComponent} from "./rooster-page/rooster-page.component";
import {JaarTotalenComponent} from "./jaar-totalen/jaar-totalen.component";
import {ExtendedModule} from "@angular/flex-layout";
import {DragDropModule} from "@angular/cdk/drag-drop";


@NgModule({
    declarations: [
        RoosterPageComponent,
        JaarTotalenComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ExtendedModule,
        FontAwesomeModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: RoosterPageComponent
            }
        ]),
        DragDropModule
    ],
    exports: [
        RoosterPageComponent
    ]
})

export class RoosterModule {
}
