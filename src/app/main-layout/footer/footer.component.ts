import {animate, style, transition, trigger} from '@angular/animations';
import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {SharedService} from "../../services/shared/shared.service";

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    animations: [
        trigger('slideInOut', [
            transition(':enter', [
                style({ transform: 'translateX(-100%)' }),
                animate('0.3s ease-out', style({ transform: 'translateX(0%)' }))
            ]),
            transition(':leave', [
                style({ transform: 'translateX(0%)' }),
                animate('0.3s ease-out', style({ transform: 'translateX(-100%)' }))
            ])
        ])
    ]
})
export class FooterComponent {
    toonMenu: boolean = false;

    constructor(private readonly router: Router,
                private readonly sharedService: SharedService) {
        this.router.events.subscribe(() => {
            this.toonMenu = false;
        });

        this.sharedService.ingegevenDatum.subscribe(datum => {
            this.toonMenu = false;
        });
    }

    menuShowHide() {
        this.toonMenu = !this.toonMenu;
    }
}

