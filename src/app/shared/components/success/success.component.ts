import { Component, ElementRef, Input, OnChanges, SimpleChanges, viewChild } from '@angular/core';
import { SuccessMessage } from '../../../types/Utils';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-success',
    templateUrl: './success.component.html',
    styleUrls: ['./success.component.scss'],
    imports: [NgClass]
})
export class SuccessComponent implements OnChanges {
    @Input() success: SuccessMessage | undefined = undefined;
    readonly errorOverlay = viewChild.required<ElementRef>('successOverlay');

    showSuccess = false;

    ngOnChanges(_: SimpleChanges) {
        this.showSuccess = true;

        setTimeout(() => {
            this.showSuccess = false;
        }, 5000);
    }
}
