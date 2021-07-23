import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-pegasus-card',
    templateUrl: './pegasus-card.component.html',
    styleUrls: ['./pegasus-card.component.scss']
})
export class PegasusCardComponent {
    @Input() icon: IconDefinition = faQuestionCircle
    @Input() img: string
    @Input() titel: string;
    @Input() subtitel: string;
    @Input() exportEnabled: boolean = true;
    @Output() excelExport: EventEmitter<void> = new EventEmitter<void>();

    hasExportListener: boolean;

    ngOnInit(): void {
        this.hasExportListener = this.excelExport.observers.length > 0
    }

    export() {
        this.excelExport.emit();
    }
}
