import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppComponent} from './main-layout/app/app.component';
import {TreeviewModule } from 'ngx-treeview';
import {PagesModule} from './pages/pages.module';
import {SharedModule} from './shared/shared.module';
import {RoutingModule} from './routing.module';
import {NavigationComponent} from './main-layout/navigation/navigation.component';
import {FooterComponent} from './main-layout/footer/footer.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {LazyLoadImageModule} from "ng-lazyload-image";
import {PegasusConfigService} from "./services/shared/pegasus-config.service";
import { HttpClientModule } from '@angular/common/http';

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
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RoutingModule,
        FormsModule,
        SharedModule,
        PagesModule,
        FormsModule,
        ReactiveFormsModule,
        FontAwesomeModule,
        LazyLoadImageModule,
        NgbModule,
        HttpClientModule,
        TreeviewModule.forRoot(),
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
