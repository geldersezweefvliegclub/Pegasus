import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppComponent} from './main-layout/app/app.component';
import {TreeviewModule} from 'ngx-treeview';
import {SharedModule} from './shared/shared.module';
import {RoutingModule} from './routing.module';
import {NavigationComponent} from './main-layout/navigation/navigation.component';
import {FooterComponent} from './main-layout/footer/footer.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {LazyLoadImageModule} from "ng-lazyload-image";
import {PegasusConfigService} from "./services/shared/pegasus-config.service";
import {HttpClientModule} from '@angular/common/http';
import {ExtendedModule} from "@angular/flex-layout";
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';
import {PopupKalenderComponent} from "./main-layout/navigation/popup-kalender/popup-kalender.component";

export function initializeApp(appConfigService: PegasusConfigService) {
    return (): Promise<any> => {
        return appConfigService.load();
    }
}

@NgModule({
    declarations: [
        AppComponent,
        NavigationComponent,
        FooterComponent,
        PopupKalenderComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RoutingModule,

        FormsModule,
        SharedModule,
        ReactiveFormsModule,
        FontAwesomeModule,
        LazyLoadImageModule,
        NgbModule,
        HttpClientModule,
        ExtendedModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
          enabled: environment.production,
          // Register the ServiceWorker as soon as the app is stable
          // or after 30 seconds (whichever comes first).
          registrationStrategy: 'registerImmediately'
        }),
    ],
    providers: [
        PegasusConfigService,
        {provide: APP_INITIALIZER, useFactory: initializeApp, deps: [PegasusConfigService], multi: true}
    ],
    bootstrap: [AppComponent],

    schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
}
