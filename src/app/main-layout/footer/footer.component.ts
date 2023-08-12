import {Component} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {SharedService} from "../../services/shared/shared.service";
import {slideInOutLeftAnimation} from "../../utils/animations";
import {filter} from "rxjs/operators";


@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    animations: [
        slideInOutLeftAnimation
    ]
})
export class FooterComponent {
    toonMenu: boolean = false;

    constructor(private readonly router: Router,
                private readonly sharedService: SharedService) {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.toonMenu = false);
        this.sharedService.ingegevenDatum.subscribe(datum => {
            this.toonMenu = false;
        });
    }
}

