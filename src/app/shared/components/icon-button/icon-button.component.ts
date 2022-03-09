import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {fas} from '@fortawesome/free-solid-svg-icons';
import {far, IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {FlipProp} from '@fortawesome/fontawesome-svg-core';
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {VliegtuigenService} from "../../../services/apiservice/vliegtuigen.service";
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {LoginService} from "../../../services/apiservice/login.service";
import {Router} from "@angular/router";

@Component({
    selector: 'app-icon-button',
    templateUrl: './icon-button.component.html',
    styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent implements OnInit {
    @Input() tekst: string = '';
    @Input() iconNaam: string;
    @Input() btnColor: string = 'btn-secondary';
    @Input() disabled: boolean = false;
    @Input() flip: FlipProp;
    @Input() type: 'button' | 'submit' = 'button';
    @Output() btnClicked: EventEmitter<void> = new EventEmitter<void>();

    faIcon: IconDefinition;
    toonTekst: boolean = true;

    constructor(private readonly sharedService: SharedService) {}

    ngOnInit(): void {
        this.toonTekst = (this.sharedService.getSchermSize() > SchermGrootte.md)

        if (this.iconNaam) {
            let parts: string[] = this.iconNaam.split(' ');

            if (parts.length != 2) {
                console.error('iconNaam moet 2 parameters hebben');
                this.faIcon = fas['faQuestion'];
            } else {
                if (parts[0] == 'fas') {
                    this.faIcon = fas['fa' + parts[1]];
                } else {
                    this.faIcon = far['fa' + parts[1]];
                }

                if (!this.faIcon) {
                    console.log('fa' + parts[1]);
                    console.log('fas', fas);
                    console.log('far', far);
                    this.faIcon = fas['faExclamation'];
                }
            }
        }
    }

    buttonClicked() {
        this.btnClicked.emit();
    }

    @HostListener('window:resize', ['$event'])
    onWindowResize() {
        this.toonTekst = (this.sharedService.getSchermSize() > SchermGrootte.md)
    }
}
