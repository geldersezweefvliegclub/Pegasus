import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactiesGridComponent } from './transacties-grid/transacties-grid.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { BedragRenderComponent } from './transacties-grid/bedrag-render/bedrag-render.component';
import { OmschrijvingRenderComponent } from './transacties-grid/omschrijving-render/omschrijving-render.component';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
    declarations: [
        TransactiesGridComponent,
        BedragRenderComponent,
        OmschrijvingRenderComponent
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
        NgbDatepickerModule
    ],
    exports: [TransactiesGridComponent]
})

export class TransactiesModule {
}
