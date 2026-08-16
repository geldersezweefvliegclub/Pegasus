import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SharedService } from '../../services/shared/shared.service';
import { filter } from 'rxjs/operators';


@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
    private readonly router = inject(Router);
    private readonly sharedService = inject(SharedService);
    toonMenu = false;

    constructor() {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.toonMenu = false);
        this.sharedService.ingegevenDatum.subscribe(() => {
            this.toonMenu = false;
        });
    }
}

