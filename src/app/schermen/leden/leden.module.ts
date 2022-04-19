import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {SharedModule} from "../../shared/shared.module";
import {RouterModule} from "@angular/router";
import {LedenGridComponent} from "./leden-grid/leden-grid.component";
import {ExtendedModule, GridModule} from "@angular/flex-layout";
import {AvatarRenderComponent} from "./avatar-render/avatar-render.component";
import {AdresRenderComponent} from "./adres-render/adres-render.component";
import {TelefoonRenderComponent} from "./telefoon-render/telefoon-render.component";
import {EmailRenderComponent} from "./email-render/email-render.component";
import {NaamRenderComponent} from "./naam-render/naam-render.component";
import {TrackRenderComponent} from "./track-render/track-render.component";

@NgModule({
    declarations: [
        LedenGridComponent,
        AvatarRenderComponent,
        AdresRenderComponent,
        TelefoonRenderComponent,
        EmailRenderComponent,
        NaamRenderComponent,
        TrackRenderComponent,],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,
        RouterModule.forChild([
            {
                path: '',
                component: LedenGridComponent
            }
        ]),
        GridModule,
        ExtendedModule
    ],
    exports: [LedenGridComponent]
})
export class LedenModule {
}
