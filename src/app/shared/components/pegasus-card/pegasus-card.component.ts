import { Component, Input, input, output } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
    selector: 'app-pegasus-card',
    templateUrl: './pegasus-card.component.html',
    styleUrls: ['./pegasus-card.component.scss'],
    imports: [NgClass, FaIconComponent, AvatarComponent]
})
export class PegasusCardComponent {
    readonly icon = input<IconDefinition>(faQuestionCircle);
    readonly minimum = input(false);
    @Input() img: string
    readonly titel = input.required();
    readonly subtitel = input.required();
    readonly exportEnabled = input(false);
    readonly exportImg = input("/assets/img/excel-logo.png");
    readonly Exporting = output<void>();

    export() {
        this.Exporting.emit();
    }

    hoogte() {
        return (this.minimum()) ? "" : "h-100";
    }
}
