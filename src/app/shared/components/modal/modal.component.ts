import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';


@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
    @Input() titel = 'Editor';
    @Input() popupClass: string;
    @ViewChild('content') content: ElementRef;

    cross: IconDefinition = faTimes;
    private modalRef: NgbModalRef;

    constructor(private modalService: NgbModal) {
    }

    open() {
        this.modalRef = this.modalService.open(this.content, {
            ariaLabelledBy: 'modal-basic-title',
            backdrop: "static",
            windowClass: this.popupClass,
        });

        this.modalRef.result.then()
    }

    close() {
        if (this.modalRef !== undefined) {
            this.modalRef.close();
        }
    }
}
