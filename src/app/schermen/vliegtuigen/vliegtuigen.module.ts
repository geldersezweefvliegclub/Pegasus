import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {VliegtuigenSchermComponent} from "./vliegtuigen-scherm/vliegtuigen-scherm.component";
import {ZitplaatsRenderComponent} from "./zitplaats-render/zitplaats-render.component";
import {HandboekRenderComponent} from "./handboek-render/handboek-render.component";
import {IconRenderComponent} from "./icon-render/icon-render.component";
import {ExtendedModule} from "@angular/flex-layout";
import {VliegtuigLogboekComponent} from "./vliegtuig-logboek/vliegtuig-logboek.component";
import {NgChartsModule} from "ng2-charts";
import { VliegtuigCardComponent } from './vliegtuig-card/vliegtuig-card.component';

@NgModule({
    declarations: [
        VliegtuigenSchermComponent,
        VliegtuigLogboekComponent,
        ZitplaatsRenderComponent,
        HandboekRenderComponent,
        IconRenderComponent,
        VliegtuigCardComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        NgChartsModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: VliegtuigenSchermComponent
            },
            {
                path: 'vlogboek',
                component: VliegtuigLogboekComponent
            }
        ]),
        ExtendedModule
    ],
    exports: [
        VliegtuigenSchermComponent,
        VliegtuigLogboekComponent
    ]
})

export class VliegtuigenModule {
}
