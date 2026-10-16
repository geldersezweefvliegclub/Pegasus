import { Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';


@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    imports: [FaIconComponent]
})
export class ModalComponent {
    private modalService = inject(NgbModal);

    readonly titel = input('Editor');
    readonly popupClass = input<string>();
    readonly content = viewChild.required<ElementRef>('content');

    cross: IconDefinition = faTimes;
    private modalRef: NgbModalRef;

    open() {
        // NgbModal zet aria-hidden op <app-root>. Als de knop waarmee de popup geopend wordt dan nog focus heeft,
        // weigert de browser dat (melding "Blocked aria-hidden on an element because its descendant retained focus")
        (document.activeElement as HTMLElement | null)?.blur();

        this.modalRef = this.modalService.open(this.content(), {
            ariaLabelledBy: 'modal-basic-title',
            backdrop: "static",
            windowClass: this.popupClass(),
        });

        this.modalRef.shown.subscribe(() => {
            window.dispatchEvent(new Event('resize'));
        });

        this.modalRef.result.then()
    }

    close() {
        if (this.modalRef !== undefined) {
            this.modalRef.close();
        }
    }
}
