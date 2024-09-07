import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {VluchtenGridComponent} from "./vluchten-grid/vluchten-grid.component";
import {SharedModule} from "../../shared/shared.module";
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {ExportStartlijstComponent} from "./export-startlijst/export-startlijst.component";
import {AchterinRenderComponent} from "./achterin-render/achterin-render.component";
import {VoorinRenderComponent} from "./voorin-render/voorin-render.component";
import {DagnummerRenderComponent} from "./dagnummer-render/dagnummer-render.component";
import {NgSelectModule} from "@ng-select/ng-select";
import { FlarmLijstComponent } from './flarm-lijst/flarm-lijst.component';
import { StartDetailsComponent } from './start-details/start-details.component';
import { OpmerkingenRenderComponent } from './opmerkingen-render/opmerkingen-render.component';


@NgModule({
    declarations: [
        VluchtenGridComponent,
        ExportStartlijstComponent,
        AchterinRenderComponent,
        VoorinRenderComponent,
        DagnummerRenderComponent,
        FlarmLijstComponent,
        StartDetailsComponent,
        OpmerkingenRenderComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,
        RouterModule.forChild([
            {
                path: '',
                component: VluchtenGridComponent
            }
        ]),
        NgSelectModule
    ],
    exports: [
        VluchtenGridComponent,
    ]
})
export class VluchtenModule {
}
