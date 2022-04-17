import {NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FlexLayoutModule} from '@angular/flex-layout';

import {SharedModule} from '../shared/shared.module';
import {PegasusCardComponent} from '../shared/components/pegasus-card/pegasus-card.component';
import {DashboardPageComponent} from './dashboard/dashboard-page.component';
import {ProfielPageComponent} from './profiel/profiel-page.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {LoginPageComponent} from './login-page/login-page.component';
import {CodeInputModule} from 'angular-code-input';
import {VliegtuigenGridComponent} from './vliegtuigen-grid/vliegtuigen-grid.component';
import {ZitplaatsRenderComponent} from './vliegtuigen-grid/zitplaats-render/zitplaats-render.component';
import {LedenGridComponent} from './leden-grid/leden-grid.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {VluchtenGridComponent} from './vluchten-grid/vluchten-grid.component';
import {NgbDatepickerModule, NgbPopoverModule, NgbTypeaheadModule} from '@ng-bootstrap/ng-bootstrap';
import {VoorinRenderComponent} from './vluchten-grid/voorin-render/voorin-render.component';
import {AchterinRenderComponent} from './vluchten-grid/achterin-render/achterin-render.component';
import {StarttijdRenderComponent} from '../shared/components/datatable/starttijd-render/starttijd-render.component';
import {LandingstijdRenderComponent} from '../shared/components/datatable/landingstijd-render/landingstijd-render.component';
import {DaginfoComponent} from './daginfo/daginfo.component';
import {CustomFormsModule} from 'ng2-validation';
import {NgSelectModule} from '@ng-select/ng-select';
import {ComposeMeteoComponent} from './daginfo/compose-meteo/compose-meteo.component';
import {ComposeBedrijfComponent} from './daginfo/compose-bedrijf/compose-bedrijf.component';
import {AvatarRenderComponent} from './leden-grid/avatar-render/avatar-render.component';
import {AdresRenderComponent} from './leden-grid/adres-render/adres-render.component';
import {TelefoonRenderComponent} from './leden-grid/telefoon-render/telefoon-render.component';
import {LazyLoadImageModule} from 'ng-lazyload-image';
import {EmailRenderComponent} from './leden-grid/email-render/email-render.component';
import {LedenFilterComponent} from '../shared/components/leden-filter/leden-filter.component';
import {VliegtuigLogboekComponent} from './vliegtuig-logboek/vliegtuig-logboek.component';
import {ChartsModule} from 'ng2-charts';
import {NaamRenderComponent} from './leden-grid/naam-render/naam-render.component';
import {RoosterPageComponent} from './rooster-page/rooster-page.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {TrackRenderComponent} from './leden-grid/track-render/track-render.component';
import {TracksGridComponent} from './tracks-grid/tracks-grid.component';
import {JaarTotalenComponent} from './rooster-page/jaar-totalen/jaar-totalen.component';
import {ExportStartlijstComponent} from './vluchten-grid/export-startlijst/export-startlijst.component';
import {AuditPageComponent} from './audit-page/audit-page.component';
import {ReserveringPageComponent} from './reservering-page/reservering-page.component';
import {KistSelectieComponent} from './reservering-page/kist-selectie/kist-selectie.component';
import {HandboekRenderComponent} from './vliegtuigen-grid/handboek-render/handboek-render.component';
import {StartlijstPageComponent} from './startlijst-page/startlijst-page.component';
import {DagnummerRenderComponent} from "./vluchten-grid/dagnummer-render/dagnummer-render.component";

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
        DashboardPageComponent,
        ProfielPageComponent,
        NotFoundComponent,
        LoginPageComponent,
        VliegtuigenGridComponent,
        ZitplaatsRenderComponent,
        LedenGridComponent,
        VluchtenGridComponent,
        VoorinRenderComponent,
        AchterinRenderComponent,
        StarttijdRenderComponent,
        LandingstijdRenderComponent,
        DaginfoComponent,
        ComposeMeteoComponent,
        ComposeBedrijfComponent,
        AvatarRenderComponent,
        AdresRenderComponent,
        TelefoonRenderComponent,
        EmailRenderComponent,
        LedenFilterComponent,
        VliegtuigLogboekComponent,
        NaamRenderComponent,
        RoosterPageComponent,
        TrackRenderComponent,
        TracksGridComponent,
        JaarTotalenComponent,
        ExportStartlijstComponent,
        AuditPageComponent,
        ReserveringPageComponent,
        KistSelectieComponent,
        HandboekRenderComponent,
        StartlijstPageComponent,
        DagnummerRenderComponent,
    ],
    exports: [
        PegasusCardComponent,
        DashboardPageComponent,
        CodeInputModule,
        ChartsModule
    ],
    schemas: [NO_ERRORS_SCHEMA]
})
export class PagesModule {
}

