import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {faTimes} from '@fortawesome/free-solid-svg-icons';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";


@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
    @Input() titel: string = 'Editor';
    @Input() popupClass: string;
    @ViewChild('content') content: ElementRef;

    cross: IconDefinition = faTimes;
    private modalRef: any;

    constructor(private modalService: NgbModal) { }

    async open() {
        this.modalService.open(this.content,
        {   ariaLabelledBy: 'modal-basic-title',
                    windowClass: this.popupClass
                }).result.then((result) => { this.modalRef = result}, (reason) => {
        });
    }

    close() {
        this.modalService.dismissAll() // close(this.modalRef);
    }
}
