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
import {FormsModule} from '@angular/forms';
import {IconButtonComponent} from './components/icon-button/icon-button.component';
import {RegistratieDirective} from './components/editors/vliegtuig-editor/registratie.directive';
import {DeleteActionComponent} from './components/datatable/delete-action/delete-action.component';
import {RestoreActionComponent} from './components/datatable/restore-action/restore-action.component';
import {StartEditorComponent} from './components/editors/start-editor/start-editor.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {VliegtuigInvoerComponent} from './components/editors/start-editor/vliegtuig-invoer/vliegtuig-invoer.component';
import {LidInvoerComponent} from './components/editors/start-editor/lid-invoer/lid-invoer.component';
import {TelefoonValidatorDirective} from './directives/TelefoonValidator/telefoon-validator.directive';
import {WachtwoordMatchValidatorDirective} from './directives/WachtwoordMatchValidator/wachtwoord-match-validator.directive';
import {DatumRenderComponent} from './components/datatable/datum-render/datum-render.component';
import {LogboekRenderComponent} from './components/datatable/logboek-render/logboek-render.component';
import {AvatarComponent} from './components/avatar/avatar.component';
import {LazyLoadImageModule} from 'ng-lazyload-image';
import {VliegerLogboekComponent} from './components/vlieger-logboek/vlieger-logboek.component';
import {PvbComponent} from './components/pvb/pvb.component';
import {RecencyComponent} from './components/recency/recency.component';
import {StatusComponent} from './components/status/status.component';
import {TijdInvoerComponent} from './components/editors/tijd-invoer/tijd-invoer.component';
import {NaamRenderComponent} from './components/vlieger-logboek/naam-render/naam-render.component';
import {WachtwoordSterkteValidatorDirective} from './directives/WachtwoordSterkteValidator/wachtwoord-sterkte-validator.directive';
import {RecencyGrafiekComponent} from './components/recency/recency-grafiek/recency-grafiek.component';
import {ChartsModule} from 'ng2-charts';
import {NgbDatepickerModule, NgbPopoverModule, NgbProgressbarModule} from '@ng-bootstrap/ng-bootstrap';
import {
  ProgressieBoomComponent,
  ProgressieTreeviewItemComponent
} from './components/progressie-boom/progressie-boom.component';
import {TreeviewModule} from 'ngx-treeview';
import {PegasusCardComponent} from './components/pegasus-card/pegasus-card.component';
import {LidEditorComponent} from './components/editors/lid-editor/lid-editor.component';


@NgModule({
  imports: [
    CommonModule,
    AgGridModule.withComponents([]),
    FontAwesomeModule,
    FormsModule,
    NgSelectModule,
    LazyLoadImageModule,
    ChartsModule,
    NgbDatepickerModule,
    NgbPopoverModule,
    NgbProgressbarModule,
    TreeviewModule
  ],
  declarations: [
    PegasusCardComponent,
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
    StartEditorComponent,
    VliegtuigInvoerComponent,
    LidInvoerComponent,
    TelefoonValidatorDirective,
    WachtwoordMatchValidatorDirective,
    DatumRenderComponent,
    LogboekRenderComponent,
    AvatarComponent,
    VliegerLogboekComponent,
    PvbComponent,
    RecencyComponent,
    StatusComponent,
    TijdInvoerComponent,
    NaamRenderComponent,
    WachtwoordSterkteValidatorDirective,
    RecencyGrafiekComponent,
    LidEditorComponent,
    ProgressieBoomComponent
  ],
  exports: [
    LidEditorComponent,
    PegasusCardComponent,
    AvatarComponent,
    ModalComponent,
    DatatableComponent,
    ErrorComponent,
    LoaderComponent,
    VliegtuigEditorComponent,
    IconButtonComponent,
    StartEditorComponent,
    TelefoonValidatorDirective,
    WachtwoordMatchValidatorDirective,
    VliegerLogboekComponent,
    PvbComponent,
    RecencyComponent,
    StatusComponent,
    TijdInvoerComponent,
    WachtwoordSterkteValidatorDirective,
    ProgressieBoomComponent
  ],
  providers: [],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule {
}
