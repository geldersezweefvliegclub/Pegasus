import {Component, Input, OnInit} from '@angular/core';
import {HeliosJournaalDataset, HeliosLedenDataset, HeliosLid, HeliosLidData} from "../../../types/Helios";
import {faEnvelope} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../../services/apiservice/login.service";

@Component({
    selector: 'app-leden-card',
    templateUrl: './leden-card.component.html',
    styleUrls: ['./leden-card.component.scss']
})
export class LedenCardComponent implements OnInit {
    @Input() lid: HeliosLedenDataset;

    toonTegoed: boolean = false;        // toon DDWV tegoed

    constructor(private readonly loginService: LoginService) {
    }

    ngOnInit(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.toonTegoed = ui?.isBeheerder! || ui?.isBeheerderDDWV!
    }

    protected readonly faIcon = faEnvelope;
}
