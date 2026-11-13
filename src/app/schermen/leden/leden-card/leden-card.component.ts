import { Component, Input, OnInit, inject } from '@angular/core';
import { HeliosLedenDataset } from '../../../types/Helios';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { LoginService } from '../../../services/apiservice/login.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-leden-card',
    templateUrl: './leden-card.component.html',
    styleUrls: ['./leden-card.component.scss'],
    imports: [AvatarComponent, RouterLink, FaIconComponent]
})
export class LedenCardComponent implements OnInit {
    @Input() lid: HeliosLedenDataset;

    // variablen in html formulier
    protected readonly faIcon = faEnvelope;

    protected naarDashboard = false;

    // private variable voor ts script
    private readonly loginService = inject(LoginService);

    ngOnInit(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.naarDashboard = (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur) ?? false;
    }
}
