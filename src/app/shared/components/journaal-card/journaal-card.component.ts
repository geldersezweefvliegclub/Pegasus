import { Component, Input, OnInit, inject, viewChild } from '@angular/core';
import { HeliosJournaalDataset } from '../../../types/Helios';
import { SharedService } from '../../../services/shared/shared.service';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { JournaalEditorComponent } from '../editors/journaal-editor/journaal-editor.component';

import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-journaal-card',
    templateUrl: './journaal-card.component.html',
    styleUrls: ['./journaal-card.component.scss'],
    imports: [FaIconComponent, JournaalEditorComponent]
})
export class JournaalCardComponent implements OnInit {
    @Input() melding: HeliosJournaalDataset;

    // variablen in html formulier
    protected readonly editor = viewChild.required(JournaalEditorComponent);
    protected readonly iconEdit = faPenToSquare;

    // private variable voor ts script
    private readonly sharedService = inject(SharedService);


    ngOnInit(): void {
    }

    protected openEditor() {
        this.editor().openPopup(this.melding as HeliosJournaalDataset);
    }

    protected details(melding: HeliosJournaalDataset) {
        window.alert("Gemeld door " + melding.MELDER + " op " +  this.sharedService.datumDMJ(melding.DATUM!));
    }
}
