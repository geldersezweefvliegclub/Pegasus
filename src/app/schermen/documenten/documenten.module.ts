import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DocumentenSchermComponent} from './documenten-scherm/documenten-scherm.component';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {NgSelectModule} from "@ng-select/ng-select";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {DaginfoComponent} from "../daginfo/daginfo/daginfo.component";


@NgModule({
    declarations: [
        DocumentenSchermComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        NgSelectModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: DocumentenSchermComponent
            }
        ])
    ],
    exports: [
        DocumentenSchermComponent
    ]
})
export class DocumentenModule {
}
