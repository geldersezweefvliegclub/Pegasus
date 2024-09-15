import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { AuditPageComponent } from './audit-page/audit-page.component';

@NgModule({
    declarations: [
        AuditPageComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: AuditPageComponent
            }
        ])
    ],
    exports: [
        AuditPageComponent
    ]
})

export class AuditModule {
}
