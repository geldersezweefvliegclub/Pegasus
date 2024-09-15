import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturenSchermComponent } from './facturen-scherm/facturen-scherm.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { TypeRenderComponent } from './facturen-scherm/type-render/type-render.component';
import { LeeftijdRenderComponent } from './facturen-scherm/leeftijd-render/leeftijd-render.component';
import { GefactureerdRenderComponent } from './facturen-scherm/gefactureerd-render/gefactureerd-render.component';
import { UploadenComponent } from './facturen-scherm/uploaden/uploaden.component';
import { BaseChartDirective } from 'ng2-charts';
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
    FacturenSchermComponent,
    TypeRenderComponent,
    LeeftijdRenderComponent,
    GefactureerdRenderComponent,
    UploadenComponent
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
                component: FacturenSchermComponent
            }
        ]),
        BaseChartDirective,
        NgbProgressbarModule
    ],
  exports: [
    FacturenSchermComponent
  ]
})
export class FacturenModule { }
