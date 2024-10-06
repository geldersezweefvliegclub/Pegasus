import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { DaginfoComponent } from './daginfo/daginfo.component';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  declarations: [
    DaginfoComponent
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
        component: DaginfoComponent
      }
    ])
  ],
  exports: [
    DaginfoComponent
  ]
})

export class DaginfoModule { }
