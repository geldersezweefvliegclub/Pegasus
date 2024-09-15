import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JournaalSchermComponent } from './journaal-scherm/journaal-scherm.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { MaterieelRenderComponent } from './materieel-render/materieel-render.component';
import { StatusRenderComponent } from './status-render/status-render.component';
import { CategorieRenderComponent } from './categorie-render/categorie-render.component';
import { JournaalFilterComponent } from './journaal-filter/journaal-filter.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { TitleRenderComponent } from './title-render/title-render.component';

@NgModule({
    declarations: [
        JournaalSchermComponent,
        MaterieelRenderComponent,
        StatusRenderComponent,
        CategorieRenderComponent,
        JournaalFilterComponent,
        TitleRenderComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,

        RouterModule.forChild([
            {
                path: '',
                component: JournaalSchermComponent
            }
        ]),
        NgSelectModule,
    ]
})
export class JournaalModule {
}
