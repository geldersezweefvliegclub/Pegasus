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
import {TelefoonValidatorDirective} from './components/editors/lid-editor/telefoon-validator.directive';
import {WachtwoordMatchValidatorDirective} from './components/editors/lid-editor/wachtwoord-match-validator.directive';
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
import {WachtwoordSterkteValidatorDirective} from './components/editors/lid-editor/wachtwoord-sterkte-validator.directive';
import {RecencyGrafiekComponent} from './components/recency/recency-grafiek/recency-grafiek.component';
import {NgChartsModule} from 'ng2-charts';
import {NgbDatepickerModule, NgbPopoverModule, NgbProgressbarModule} from '@ng-bootstrap/ng-bootstrap';
import {ProgressieBoomComponent} from './components/progressie-boom/progressie-boom.component';
import {TreeviewModule} from 'ngx-treeview';
import {PegasusCardComponent} from './components/pegasus-card/pegasus-card.component';
import {LidEditorComponent} from './components/editors/lid-editor/lid-editor.component';
import {ImageCropperModule} from 'ngx-image-cropper';
import {ImageCropComponent} from './components/image-crop/image-crop.component';
import {VliegerLogboekTotalenComponent} from './components/vlieger-logboek-totalen/vlieger-logboek-totalen.component';
import {RouterModule} from "@angular/router";
import {TrackEditorComponent} from './components/editors/track-editor/track-editor.component';
import {TrackRenderComponent} from './components/vlieger-logboek/track-render/track-render.component';
import {TracksComponent} from './components/tracks/tracks.component';
import {OnderdrukNulComponent} from './components/datatable/onderdruk-nul/onderdruk-nul.component';
import {DienstenComponent} from './components/diensten/diensten.component';
import {DagRoosterComponent} from './components/dag-rooster/dag-rooster.component';
import {SuccessComponent} from './components/success/success.component';
import {InstructieGrafiekComponent} from './components/recency/instructie-grafiek/instructie-grafiek.component';
import {BoekingEditorComponent} from './components/editors/boeking-editor/boeking-editor.component';
import {DatumKortRenderComponent} from './components/datatable/datum-kort-render/datum-kort-render.component';
import {StatusButtonComponent} from './components/status-button/status-button.component';
import {IconRenderComponent} from './components/vlieger-logboek/icon-render/icon-render.component';
import {VluchtCardComponent} from './components/vlucht-card/vlucht-card.component';
import {AanmeldenVliegtuigComponent} from './components/aanmelden-vliegtuig/aanmelden-vliegtuig.component';
import {DragDropModule} from "@angular/cdk/drag-drop";
import {AanmeldenLedenComponent} from './components/aanmelden-leden/aanmelden-leden.component';
import {ExtendedModule} from "@angular/flex-layout";
import {LidAanwezigEditorComponent} from './components/editors/lid-aanwezig-editor/lid-aanwezig-editor.component';
import {LedenFilterComponent} from "./components/leden-filter/leden-filter.component";
import {StarttijdRenderComponent} from "./components/datatable/starttijd-render/starttijd-render.component";
import {LandingstijdRenderComponent} from "./components/datatable/landingstijd-render/landingstijd-render.component";
import {DienstEditorComponent} from './components/editors/dienst-editor/dienst-editor.component';
import {TypeEditorComponent} from './components/editors/type-editor/type-editor.component';
import {CompetentieEditorComponent} from './components/editors/competentie-editor/competentie-editor.component';
import {GastEditorComponent} from './components/editors/gast-editor/gast-editor.component';
import {GastInvoerComponent} from './components/editors/start-editor/gast-invoer/gast-invoer.component';
import {TransactiesComponent} from './components/transacties/transacties.component';
import {TransactieEditorComponent} from './components/editors/transactie-editor/transactie-editor.component';
import {IdealBestellenComponent} from './components/ideal-bestellen/ideal-bestellen.component';
import {DatumtijdRenderComponent} from './components/datatable/datumtijd-render/datumtijd-render.component';
import {DagRapportEditorComponent} from './components/editors/dag-rapport-editor/dag-rapport-editor.component';
import {ComposeMeteoComponent} from "./components/editors/dag-rapport-editor/compose-meteo/compose-meteo.component";
import {ComposeBedrijfComponent} from "./components/editors/dag-rapport-editor/compose-bedrijf/compose-bedrijf.component";
import {ProgressieEditorComponent} from './components/editors/progressie-editor/progressie-editor.component';
import {VoortgangComponent} from './components/voortgang/voortgang.component';

@NgModule({
    imports: [
        CommonModule,
        AgGridModule,
        FontAwesomeModule,
        FormsModule,
        NgSelectModule,
        LazyLoadImageModule,
        NgChartsModule,
        NgbDatepickerModule,
        NgbPopoverModule,
        NgbProgressbarModule,
        TreeviewModule,
        TreeviewModule.forRoot(),
        ImageCropperModule,
        RouterModule,
        DragDropModule,
        ExtendedModule
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
        ProgressieBoomComponent,
        ImageCropComponent,
        VliegerLogboekTotalenComponent,
        TrackEditorComponent,
        TrackRenderComponent,
        TracksComponent,
        OnderdrukNulComponent,
        DienstenComponent,
        DagRoosterComponent,
        SuccessComponent,
        InstructieGrafiekComponent,
        BoekingEditorComponent,
        DatumKortRenderComponent,
        StatusButtonComponent,
        IconRenderComponent,
        VluchtCardComponent,
        AanmeldenVliegtuigComponent,
        AanmeldenLedenComponent,
        LidAanwezigEditorComponent,
        LedenFilterComponent,
        StarttijdRenderComponent,
        LandingstijdRenderComponent,
        DienstEditorComponent,
        TypeEditorComponent,
        CompetentieEditorComponent,
        GastEditorComponent,
        GastInvoerComponent,
        TransactiesComponent,
        TransactieEditorComponent,
        IdealBestellenComponent,
        DatumtijdRenderComponent,
        DagRapportEditorComponent,
        ComposeMeteoComponent,
        ComposeBedrijfComponent,
        ProgressieEditorComponent,
        VoortgangComponent,
    ],
    exports: [
        LidEditorComponent,
        PegasusCardComponent,
        AvatarComponent,
        ModalComponent,
        DatatableComponent,
        ErrorComponent,
        SuccessComponent,
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
        ProgressieBoomComponent,
        VliegerLogboekTotalenComponent,
        TracksComponent,
        TrackEditorComponent,
        DienstenComponent,
        DagRoosterComponent,
        BoekingEditorComponent,
        StatusButtonComponent,
        VluchtCardComponent,
        AanmeldenVliegtuigComponent,
        AanmeldenLedenComponent,
        LidAanwezigEditorComponent,
        LedenFilterComponent,
        StarttijdRenderComponent,
        LandingstijdRenderComponent,
        DienstEditorComponent,
        TypeEditorComponent,
        CompetentieEditorComponent,
        GastEditorComponent,
        TransactieEditorComponent,
        LidInvoerComponent,
        TransactiesComponent,
        DagRapportEditorComponent
    ],
    providers: [],
    schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})

export class SharedModule {
}
