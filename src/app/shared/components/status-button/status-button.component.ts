import {Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {far, IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {fas} from "@fortawesome/free-solid-svg-icons";
import {Subscription} from "rxjs";

@Component({
    selector: 'app-status-button',
    templateUrl: './status-button.component.html',
    styleUrls: ['./status-button.component.scss']
})
export class StatusButtonComponent implements OnInit, OnDestroy {
    @Input() tekst: string = '';
    @Input() disabled: boolean = false;
    @Input() toonKlein: boolean = true;
    @Input() actief: boolean = false;
    @Input() iconNaam: string;

    @Output() btnClicked: EventEmitter<boolean> = new EventEmitter<boolean>();

    faIcon: IconDefinition;
    toonTekst: boolean = true;

    private resizeSubscription: Subscription;           // Abonneer op aanpassing van window grootte (of draaien mobiel)
    constructor(private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
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

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize()
        });
        this.onWindowResize();
    }

    ngOnDestroy(): void {
        if (this.resizeSubscription) {
            this.resizeSubscription.unsubscribe();
        }
    }

    // op kleine scherm tonen we geen tekst bij de status button
    onWindowResize() {
        this.toonTekst = (this.sharedService.getSchermSize() > SchermGrootte.md)
    }

    buttonClicked() {
        this.actief = !this.actief;
        this.btnClicked.emit(this.actief);
    }
}
