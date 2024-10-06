import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CodeInputModule } from 'angular-code-input';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { HoofdschermComponent } from './hoofdscherm/hoofdscherm.component';

@NgModule({
  declarations: [
    HoofdschermComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    CodeInputModule,
    SharedModule,

    RouterModule.forChild([
      {
        path: '',
        component: HoofdschermComponent
      }
    ])
  ],
  exports: [
    HoofdschermComponent
  ]
})

export class HoofmenuModule { }
