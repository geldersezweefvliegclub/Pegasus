import { Component, Input, input, output } from '@angular/core';
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
    readonly zoekStringChange = output<string>();
    readonly zoeken = output<void>();
    readonly toonRefresh = input(true);

    onInputChange(value: string) {
        this.zoekString = value;
        this.zoekStringChange.emit(value);
    }
}
