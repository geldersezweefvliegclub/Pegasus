import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppComponent} from './components/app/app.component';

import {PagesModule} from './pages/pages.module';
import {SharedModule} from './shared/shared.module';

// main layout
import {NavigationComponent} from './main-layout/navigation/navigation.component';
import {FooterComponent} from './main-layout/footer/footer.component';
import {RoutingModule} from './routing.module';
import {ErrorComponent} from './components/error/error.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    FooterComponent,
    ErrorComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RoutingModule,
    FormsModule,
    SharedModule,
    PagesModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  exports: [
    ErrorComponent
  ],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
}
