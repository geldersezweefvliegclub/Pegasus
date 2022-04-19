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


@NgModule({
    declarations: [
        VluchtenGridComponent,
        ExportStartlijstComponent,
        AchterinRenderComponent,
        VoorinRenderComponent,
        DagnummerRenderComponent
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
        ])
    ],
    exports: [
        VluchtenGridComponent,
    ]
})
export class VluchtenModule {
}
