import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { StartlijstPageComponent } from './startlijst-page/startlijst-page.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';


@NgModule({
    declarations: [
        StartlijstPageComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,
        DragDropModule,
        RouterModule.forChild([
            {
                path: '',
                component: StartlijstPageComponent
            }
        ]),
        NgSelectModule
    ],
    exports: []
})
export class StartlijstModule {
}
