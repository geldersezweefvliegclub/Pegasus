import {enableProdMode, importProvidersFrom, inject, provideAppInitializer, provideZoneChangeDetection} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {provideServiceWorker} from '@angular/service-worker';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AppComponent} from './app/main-layout/app/app.component';
import {PegasusConfigService} from './app/services/shared/pegasus-config.service';
import {routes} from './app/routing.module';
import {environment} from './environments/environment';

/*
import {LicenseManager} from 'ag-grid-enterprise';
import {aggridLicense} from '../licenses';

LicenseManager.setLicenseKey(aggridLicense);
*/


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideAnimations(),
    provideHttpClient(),
    provideRouter(routes),
    importProvidersFrom(NgbModule),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerImmediately'
    }),
    provideAppInitializer(() => inject(PegasusConfigService).load())
  ]
})
  .catch(err => console.error(err));
