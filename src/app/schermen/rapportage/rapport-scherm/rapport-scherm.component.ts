import { Component, OnInit, inject } from '@angular/core';
import { PegasusConfigService } from '../../../services/shared/pegasus-config.service';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Rapport } from '../../../types/IPegasusConfig';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';

@Component({
    selector: 'app-rapport-scherm',
    templateUrl: './rapport-scherm.component.html',
    styleUrls: ['./rapport-scherm.component.scss'],
    imports: [IconButtonComponent]
})
export class RapportSchermComponent implements OnInit {
    private readonly sanitizer = inject(DomSanitizer);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly configService = inject(PegasusConfigService);

    rapporten: Rapport[] = [];

    url: SafeResourceUrl | undefined;

    ngOnInit(): void {
        this.rapporten = this.configService.getRapporten();
    }

    toonRapport(i: number) {
        const rapporten = this.configService.getRapporten();
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl(rapporten[i].Url);
    }
}
