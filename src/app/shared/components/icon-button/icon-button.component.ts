import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far, IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { FlipProp, SizeProp } from '@fortawesome/fontawesome-svg-core';
import { SchermGrootte, SharedService } from '../../../services/shared/shared.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-icon-button',
    templateUrl: './icon-button.component.html',
    styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent implements OnInit, OnDestroy {
    @Input() tekst = '';
    @Input() iconNaam: string;
    @Input() btnColor = 'btn-secondary';
    @Input() disabled = false;
    @Input() toonKlein = true;
    @Input() flip: FlipProp;
    @Input() size: SizeProp;
    @Input() stopPropagation = false;
    @Input() type: 'button' | 'submit' = 'button';
    @Output() btnClicked: EventEmitter<void> = new EventEmitter<void>();

    faIcon: IconDefinition;
    toonTekst = false;

    private resizeSubscription: Subscription;                           // Abonneer op aanpassing van window grootte (of draaien mobiel)
    constructor(private readonly sharedService: SharedService) {}

    ngOnInit(): void {
        if (this.iconNaam) {
            const parts: string[] = this.iconNaam.split(' ');

            if (parts.length != 2) {
                console.error('iconNaam moet 2 parameters hebben');
                this.faIcon = fas['faQuestion'];
            } else {
                if (parts[0] == 'fas') {
                    this.faIcon = fas['fa' + parts[1]];
                } else {
                    this.faIcon = far['fa' + parts[1]];
                }

                // als een verkeerde naam is opgegeven tonen we een uitroepteken en printen alle mogelijkheden in console
                if (!this.faIcon) {
                    console.log('fa' + parts[1]);
                    console.log('fas', fas);
                    console.log('far', far);
                    this.faIcon = fas['faExclamation'];
                }
            }
        }

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(() => {
            this.onWindowResize()
        });
        this.onWindowResize();
    }

    ngOnDestroy(): void {
        if (this.resizeSubscription) {
            this.resizeSubscription.unsubscribe();
        }
    }

    // Voor kleine schermen, tonen we alleen icoontje en geen tekst
    onWindowResize() {
        this.toonTekst = (this.sharedService.getSchermSize() > SchermGrootte.md)
    }

    // Voor de actie uit die gekoppeld is aan deze knop
    buttonClicked($event: Event) {
        if (this.stopPropagation) {
            $event.stopPropagation();           // zorg dat onderliggende element geen click event krijgen
        }
        this.btnClicked.emit();
    }
}
