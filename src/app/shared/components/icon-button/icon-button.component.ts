import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {fas} from '@fortawesome/free-solid-svg-icons';
import {far} from '@fortawesome/free-regular-svg-icons';

@Component({
    selector: 'app-icon-button',
    templateUrl: './icon-button.component.html',
    styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent implements OnInit {
    @Input() tekst: string;
    @Input() iconNaam: string;
    @Input() btnColor: string = "btn-secondary";
    @Output() OnClicked: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

    faIcon: any;

    constructor() {
    }

    ngOnInit(): void {
        let parts: string[] = this.iconNaam.split(" ");

        if (parts.length != 2) {
            console.error("iconNaam moet 2 parameters hebben")
            this.faIcon = fas["faQuestion"];
        } else {
            if (parts[0] == "fas")
                this.faIcon =  fas["fa" + parts[1]];
            else
                this.faIcon = far["fa" + parts[1]];

            if (!this.faIcon) {
                this.faIcon = fas["faExclamation"]
                console.log(far);
            }
        }
    }

    ButtonClicked(event: MouseEvent) {
        this.OnClicked.emit(event);
    }
}
