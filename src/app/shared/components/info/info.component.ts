import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { InfoMessage } from '../../../types/Utils';
import { NgClass } from '@angular/common';

// blauwe informatiemelding rechtsboven, net als app-error en app-success. Verdwijnt na 5 seconden
@Component({
    selector: 'app-info',
    templateUrl: './info.component.html',
    styleUrls: ['./info.component.scss'],
    imports: [NgClass]
})
export class InfoComponent implements OnChanges {
    @Input() info: InfoMessage | undefined = undefined;

    // variablen in html formulier
    protected toonInfo = false;

    // private variable voor ts script
    private verbergTimer: number | undefined;

    // een nieuwe melding (nieuw object) toont de box opnieuw, ook als de vorige nog zichtbaar was
    ngOnChanges(_: SimpleChanges) {
        this.toonInfo = true;

        clearTimeout(this.verbergTimer);
        this.verbergTimer = window.setTimeout(() => {
            this.toonInfo = false;
        }, 5000);
    }
}
