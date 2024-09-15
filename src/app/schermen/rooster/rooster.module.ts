import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {RoosterPageComponent} from "./rooster-page/rooster-page.component";
import {JaarTotalenComponent} from "./jaar-totalen/jaar-totalen.component";
import {DragDropModule} from "@angular/cdk/drag-drop";
import { RoosterMaandviewComponent } from './rooster-maandview/rooster-maandview.component';
import { RoosterWeekviewComponent } from './rooster-weekview/rooster-weekview.component';
import { RoosterDagviewComponent } from './rooster-dagview/rooster-dagview.component';


@NgModule({
    declarations: [
        RoosterPageComponent,
        JaarTotalenComponent,
        RoosterMaandviewComponent,
        RoosterWeekviewComponent,
        RoosterDagviewComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
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
