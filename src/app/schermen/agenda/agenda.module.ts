import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgendaSchermComponent } from './agenda-scherm/agenda-scherm.component';
import {FormsModule} from "@angular/forms";
import {SharedModule} from "../../shared/shared.module";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {RouterModule} from "@angular/router";

@NgModule({
    declarations: [
        AgendaSchermComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: AgendaSchermComponent
            }
        ])
    ],
    exports: [
        AgendaSchermComponent
    ]
})

export class AgendaModule {
}