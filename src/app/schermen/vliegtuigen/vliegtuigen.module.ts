import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {VliegtuigenGridComponent} from "./vliegtuigen-grid/vliegtuigen-grid.component";
import {ZitplaatsRenderComponent} from "./zitplaats-render/zitplaats-render.component";
import {HandboekRenderComponent} from "./handboek-render/handboek-render.component";
import {ExtendedModule} from "@angular/flex-layout";
import {VliegtuigLogboekComponent} from "./vliegtuig-logboek/vliegtuig-logboek.component";
import {ChartsModule} from "ng2-charts";

@NgModule({
    declarations: [
        VliegtuigenGridComponent,
        VliegtuigLogboekComponent,
        ZitplaatsRenderComponent,
        HandboekRenderComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        ChartsModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: VliegtuigenGridComponent
            },
            {
                path: 'vlogboek',
                component: VliegtuigLogboekComponent
            }
        ]),
        ExtendedModule
    ],
    exports: [
        VliegtuigenGridComponent,
        VliegtuigLogboekComponent
    ]
})

export class VliegtuigenModule {
}
