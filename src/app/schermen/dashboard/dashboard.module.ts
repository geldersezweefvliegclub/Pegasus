import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardPageComponent } from './dasboard-page/dashboard-page.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { LedenDocumentenComponent } from './dasboard-page/leden-documenten/leden-documenten.component';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    declarations: [
        DashboardPageComponent,
        LedenDocumentenComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: DashboardPageComponent
            }
        ]),
        NgbCarouselModule
    ],
    exports: [
        DashboardPageComponent
    ]
})
export class DashboardModule {
}
