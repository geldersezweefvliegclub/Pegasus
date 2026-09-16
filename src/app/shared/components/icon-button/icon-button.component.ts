import { Component, OnDestroy, OnInit, inject, input, output } from '@angular/core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far, IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { FlipProp, SizeProp } from '@fortawesome/fontawesome-svg-core';
import { SchermGrootte, SharedService } from '../../../services/shared/shared.service';
import { Subscription } from 'rxjs';

import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-icon-button',
    templateUrl: './icon-button.component.html',
    styleUrls: ['./icon-button.component.scss'],
    imports: [FaIconComponent]
})
export class IconButtonComponent implements OnInit, OnDestroy {
    private readonly sharedService = inject(SharedService);

    readonly tekst = input('');
    readonly iconNaam = input.required<string>();
    readonly btnColor = input('btn-secondary');
    readonly disabled = input(false);
    readonly toonKlein = input(true);
    readonly flip = input<FlipProp>();
    readonly size = input<SizeProp>();
    readonly stopPropagation = input(false);
    readonly type = input<'button' | 'submit'>('button');
    readonly btnClicked = output<void>();

    faIcon: IconDefinition;
    toonTekst = false;

    private resizeSubscription: Subscription;

    ngOnInit(): void {
        const iconNaam = this.iconNaam();
        if (iconNaam) {
            const parts: string[] = iconNaam.split(' ');

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
        if (this.stopPropagation()) {
            $event.stopPropagation();           // zorg dat onderliggende element geen click event krijgen
        }
        this.btnClicked.emit();
    }
}
