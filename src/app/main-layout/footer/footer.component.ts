import {Component} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faFilter} from "@fortawesome/free-solid-svg-icons/faFilter";
import {faBars} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../services/apiservice/login.service";

import {Router} from "@angular/router";
import {NgbCalendar} from "@ng-bootstrap/ng-bootstrap";
import {SharedService} from "../../services/shared/shared.service";

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
    jaartal = new Date().getFullYear();
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

    menuIcon: IconDefinition = faBars;

    toonHamburgerMenu() {
        return (window.innerWidth < 1200);
    }

    menuShowHide() {
        this.toonMenu = !this.toonMenu;
    }
}

