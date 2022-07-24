import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AanmeldenPageComponent} from './aanmelden-page/aanmelden-page.component';
import {RouterModule} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {ExtendedModule} from "@angular/flex-layout";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import { AanmeldenWeekviewComponent } from './aanmelden-weekview/aanmelden-weekview.component';



@NgModule({
    declarations: [
        AanmeldenPageComponent,
        AanmeldenWeekviewComponent
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
                component: AanmeldenPageComponent
            }
        ]),
    ]
})
export class AanmeldenModule {
}
