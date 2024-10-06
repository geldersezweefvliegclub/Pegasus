import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-pegasus-card',
    templateUrl: './pegasus-card.component.html',
    styleUrls: ['./pegasus-card.component.scss']
})
export class PegasusCardComponent implements OnInit{
    @Input() icon: IconDefinition = faQuestionCircle
    @Input() minimum = false;
    @Input() img: string
    @Input() titel: string;
    @Input() subtitel: string;
    @Input() exportEnabled = true;
    @Input() exportImg = "/assets/img/excel-logo.png";
    @Output() Exporting: EventEmitter<void> = new EventEmitter<void>();

    hasExportListener: boolean;

    ngOnInit(): void {
        this.hasExportListener = this.Exporting.observers.length > 0
    }

    export() {
        this.Exporting.emit();
    }

    hoogte() {
        return (this.minimum) ? "" : "h-100";
    }
}
