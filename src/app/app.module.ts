import {AgmCoreModule} from '@agm/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppComponent} from './app.component';

import {PagesModule} from './pages/pages.module';
import {SharedModule} from './shared/shared.module';

// main layout
import {NavigationComponent} from './main-layout/navigation/navigation.component';
import {FooterComponent} from './main-layout/footer/footer.component';
import {RoutingModule} from './routing.module';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    FooterComponent
  ],
  imports: [
    AgmCoreModule.forRoot({
      apiKey: ''
    }),
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
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
}
