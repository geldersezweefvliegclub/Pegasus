import {ModalComponent} from './components/modal/modal.component';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ErrorComponent} from './components/error/error.component';
import {DatatableComponent} from './components/datatable/datatable.component';
import {AgGridModule} from 'ag-grid-angular';
import {CheckboxRenderComponent} from './components/datatable/checkbox-render/checkbox-render.component';
import {LoaderComponent} from './components/loader/loader.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {VliegtuigEditorComponent} from './components/editors/vliegtuig-editor/vliegtuig-editor.component';
import {FormsModule, NG_VALIDATORS} from '@angular/forms';
import { IconButtonComponent } from './components/icon-button/icon-button.component';
import { RegistratieDirective } from './components/editors/vliegtuig-editor/registratie.directive';
import { DeleteActionComponent } from './components/datatable/delete-action/delete-action.component';
import { RestoreActionComponent } from './components/datatable/restore-action/restore-action.component';


@NgModule({
  imports: [
    CommonModule,
    AgGridModule.withComponents([]),
    FontAwesomeModule,
    FormsModule
  ],
  declarations: [
    ModalComponent,
    ErrorComponent,
    DatatableComponent,
    CheckboxRenderComponent,
    LoaderComponent,
    VliegtuigEditorComponent,
    IconButtonComponent,
    RegistratieDirective,
    DeleteActionComponent,
    RestoreActionComponent,
  ],
  exports: [
    ModalComponent,
    DatatableComponent,
    ErrorComponent,
    LoaderComponent,
    VliegtuigEditorComponent,
    IconButtonComponent,
  ],
  providers: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule {
}
