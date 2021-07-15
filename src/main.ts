import {enableProdMode, APP_INITIALIZER} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {LicenseManager} from 'ag-grid-enterprise';
import {aggridLicense} from '../licenses';

LicenseManager.setLicenseKey(aggridLicense);


if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
