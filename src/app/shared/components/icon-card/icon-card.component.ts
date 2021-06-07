import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-icon-card',
    templateUrl: './icon-card.component.html',
    styleUrls: ['./icon-card.component.scss']
})
export class IconCardComponent {
    @Input() icon: IconDefinition = faQuestionCircle
    @Input() titel: string;
    @Input() subtitel: string;
    @Input() exportEnabled: boolean = true;
    @Output() excelExport: EventEmitter<void> = new EventEmitter<void>();

    private hasExportListener: boolean;

    ngOnInit(): void {
        this.hasExportListener = this.excelExport.observers.length > 0
    }

    export() {
        this.excelExport.emit();
    }
}