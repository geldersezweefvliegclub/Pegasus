import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {SuccessMessage} from '../../../types/Utils';

@Component({
    selector: 'app-success',
    templateUrl: './success.component.html',
    styleUrls: ['./success.component.scss']
})
export class SuccessComponent implements OnChanges {
    @Input() success: SuccessMessage | undefined = undefined;
    @ViewChild('successOverlay') errorOverlay: ElementRef;

    showSuccess: boolean = false;

    ngOnChanges(changes: SimpleChanges) {
        this.showSuccess = true;

        setTimeout(() => {
            this.showSuccess = false;
        }, 5000);
    }
}
