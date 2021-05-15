import {ModalComponent} from './components/modal/modal.component';
import {MDBBootstrapModule} from 'angular-bootstrap-md';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {OverlayCardComponent} from './components/overlay-card/overlay-card.component';
import {NavigationComponent} from '../main-layout/navigation/navigation.component';
import {FooterComponent} from '../main-layout/footer/footer.component';
import {ErrorComponent} from './components/error/error.component';

@NgModule({
  imports: [
    CommonModule,
    MDBBootstrapModule.forRoot(),
  ],
  declarations: [
    OverlayCardComponent,
    ModalComponent,
    FooterComponent,
    ErrorComponent,
  ],
  exports: [
    MDBBootstrapModule,
    OverlayCardComponent,
    ModalComponent,
  ],
  providers: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule {
}
