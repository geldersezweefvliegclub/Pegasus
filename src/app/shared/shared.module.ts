import {ModalComponent} from './components/modal/modal.component';
import {MDBBootstrapModule} from 'angular-bootstrap-md';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ErrorComponent} from './components/error/error.component';
import {DatatableComponent} from './components/datatable/datatable.component';
import {AgGridModule} from 'ag-grid-angular';

@NgModule({
  imports: [
    CommonModule,
    MDBBootstrapModule.forRoot(),
    AgGridModule.withComponents([])
  ],
  declarations: [
    ModalComponent,
    ErrorComponent,
    DatatableComponent,
  ],
  exports: [
    MDBBootstrapModule,
    ModalComponent,
    DatatableComponent,
  ],
  providers: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule {
}
