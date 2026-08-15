import {enableProdMode} from '@angular/core';
import {platformBrowser} from '@angular/platform-browser';
import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

/*
import {LicenseManager} from 'ag-grid-enterprise';
import {aggridLicense} from '../licenses';

LicenseManager.setLicenseKey(aggridLicense);
*/


if (environment.production) {
  enableProdMode();
}

platformBrowser().bootstrapModule(AppModule)
  .catch(err => console.error(err));
