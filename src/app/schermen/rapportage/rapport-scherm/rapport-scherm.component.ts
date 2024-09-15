import { Component, OnInit } from '@angular/core';
import { PegasusConfigService } from '../../../services/shared/pegasus-config.service';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-rapport-scherm',
    templateUrl: './rapport-scherm.component.html',
    styleUrls: ['./rapport-scherm.component.scss']
})
export class RapportSchermComponent implements OnInit {
    rapporten: any[] = [];

    url: SafeResourceUrl | undefined;

    constructor(private readonly sanitizer: DomSanitizer,
                private readonly activatedRoute: ActivatedRoute,
                private readonly configService: PegasusConfigService) {
    }

    ngOnInit(): void {
        this.rapporten = this.configService.getRapporten();
    }

    toonRapport(i: number) {
        const rapporten = this.configService.getRapporten();
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl(rapporten[i].Url);
    }
}
