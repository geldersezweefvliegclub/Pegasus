import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AanmeldenPageComponent } from './aanmelden-page/aanmelden-page.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { SamenvattingComponent } from './samenvatting/samenvatting.component';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
    declarations: [
        AanmeldenPageComponent,
        SamenvattingComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: AanmeldenPageComponent
            }
        ]),
        NgSelectModule,
    ]
})
export class AanmeldenModule {
}
