import { Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { HeliosJournaalDataset } from '../../../types/Helios';
import { SharedService } from '../../../services/shared/shared.service';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { JournaalEditorComponent } from '../editors/journaal-editor/journaal-editor.component';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-journaal-card',
    templateUrl: './journaal-card.component.html',
    styleUrls: ['./journaal-card.component.scss'],
    imports: [NgClass, FaIconComponent, JournaalEditorComponent]
})
export class JournaalCardComponent implements OnInit {
    private readonly sharedService = inject(SharedService);

    @Input() melding: HeliosJournaalDataset;
    @ViewChild(JournaalEditorComponent) editor: JournaalEditorComponent;

    protected readonly iconEdit = faPenToSquare;
    datumDM: string

    ngOnInit(): void {
        this.datumDM = this.sharedService.datumDM(this.melding.DATUM!)    // jaar hoeft niet getoond te worden
    }

    openEditor() {
        this.editor.openPopup(this.melding as HeliosJournaalDataset);
    }

    details(melding: HeliosJournaalDataset) {
        window.alert("Gemeld door " + melding.MELDER + " op " +  this.sharedService.datumDMJ(melding.DATUM!));
    }
}
