import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { LedenSchermComponent } from './leden-scherm/leden-scherm.component';
import { AvatarRenderComponent } from './avatar-render/avatar-render.component';
import { AdresRenderComponent } from './adres-render/adres-render.component';
import { TelefoonRenderComponent } from './telefoon-render/telefoon-render.component';
import { EmailRenderComponent } from './email-render/email-render.component';
import { NaamRenderComponent } from './naam-render/naam-render.component';
import { TrackRenderComponent } from './track-render/track-render.component';
import { LedenCardComponent } from './leden-card/leden-card.component';

@NgModule({
    declarations: [
        LedenSchermComponent,
        AvatarRenderComponent,
        AdresRenderComponent,
        TelefoonRenderComponent,
        EmailRenderComponent,
        NaamRenderComponent,
        TrackRenderComponent,
        LedenCardComponent,],
    imports: [
        CommonModule,
        FormsModule,
        FontAwesomeModule,
        SharedModule,
        RouterModule.forChild([
            {
                path: '',
                component: LedenSchermComponent
            }
        ]),
    ],
    exports: [LedenSchermComponent]
})
export class LedenModule {
}
