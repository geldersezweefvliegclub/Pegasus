import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FlexLayoutModule} from '@angular/flex-layout';
import {SharedModule} from '../shared/shared.module';
import {PegasusCardComponent} from '../shared/components/pegasus-card/pegasus-card.component';
import {CodeInputModule} from 'angular-code-input';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NgbDatepickerModule, NgbPopoverModule, NgbTypeaheadModule} from '@ng-bootstrap/ng-bootstrap';

import {CustomFormsModule} from 'ng2-validation';
import {NgSelectModule} from '@ng-select/ng-select';

import {LazyLoadImageModule} from 'ng-lazyload-image';
import {ChartsModule} from 'ng2-charts';
import {DragDropModule} from '@angular/cdk/drag-drop';


@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        CodeInputModule,
        FontAwesomeModule,
        NgbDatepickerModule,
        NgbTypeaheadModule,
        CustomFormsModule,
        NgSelectModule,
        ChartsModule,
        LazyLoadImageModule,
        NgbPopoverModule,
        DragDropModule,
        FlexLayoutModule
    ],
    declarations: [
    ],
    exports: [
        PegasusCardComponent,
        CodeInputModule,
        ChartsModule
    ],
    schemas: [NO_ERRORS_SCHEMA]
})
export class PagesModule {
}

