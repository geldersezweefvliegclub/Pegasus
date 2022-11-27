import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TransactiesGridComponent} from './transacties-grid/transacties-grid.component';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {ExtendedModule, GridModule} from "@angular/flex-layout";
import { BedragRenderComponent } from './transacties-grid/bedrag-render/bedrag-render.component';
import {TransactieEditorComponent} from "../../shared/components/editors/transactie-editor/transactie-editor.component";


@NgModule({
    declarations: [
        TransactiesGridComponent,
        BedragRenderComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,
        RouterModule.forChild([
            {
                path: '',
                component: TransactiesGridComponent
            }
        ]),
        GridModule,
        ExtendedModule
    ],
    exports: [TransactiesGridComponent]
})

export class TransactiesModule {
}
