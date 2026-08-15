import { Component, Input, OnInit } from '@angular/core';
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

    toonTegoed = false;        // toon DDWV tegoed
    naarDashboard = false;     // toon link naar dashboard van het lid
    constructor(private readonly loginService: LoginService) {
    }

    ngOnInit(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.toonTegoed = (ui?.isBeheerder || ui?.isBeheerderDDWV) ?? false
        this.naarDashboard = (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur) ?? false;
    }

    protected readonly faIcon = faEnvelope;
}
