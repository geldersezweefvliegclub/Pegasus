import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
    selector: 'app-zoekbar',
    templateUrl: './zoekbar.component.html',
    styleUrls: ['./zoekbar.component.scss'],
    imports: [FormsModule, IconButtonComponent]
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
