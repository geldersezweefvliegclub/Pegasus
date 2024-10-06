import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page.component';
import { CodeInputModule } from 'angular-code-input';


@NgModule({
  declarations: [
    LoginPageComponent,
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
        component: LoginPageComponent
      }
    ])
  ],
  exports: [
    LoginPageComponent
  ]
})

export class LoginModule { }
