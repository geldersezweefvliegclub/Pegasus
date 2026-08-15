import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-zoekbar',
    templateUrl: './zoekbar.component.html',
    styleUrls: ['./zoekbar.component.scss'],
    standalone: false
})
export class ZoekbarComponent {
    @Input() zoekString: string;
    @Output() zoekStringChange = new EventEmitter<string>();
    @Output() zoeken = new EventEmitter<void>();
    @Input() toonRefresh = true;

    onInputChange(value: string) {
        this.zoekString = value;
        this.zoekStringChange.emit(value);
    }
}
