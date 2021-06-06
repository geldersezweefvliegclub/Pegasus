import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {faTimes} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() titel: string = 'Editor';
  @ViewChild('content') content: ElementRef;
  cross = faTimes;

  constructor(private modalService: NgbModal) {
  }

  open() {
    this.modalService.open(this.content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {}, (reason) => {});
  }

  close() {
    this.modalService.dismissAll()
  }
}
