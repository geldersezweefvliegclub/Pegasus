import {Component, OnInit, ViewChild} from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";
import { LazyLoadImageModule } from 'ng-lazyload-image';
import {ModalComponent} from "../../../shared/components/modal/modal.component";

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar-render.component.html',
  styleUrls: ['./avatar-render.component.scss']
})
export class AvatarRenderComponent implements AgRendererComponent {
  url: string;
  naam: string;

  @ViewChild(ModalComponent) private popup: ModalComponent;
  formTitel: any;

  constructor() { }

  agInit(params: ICellRendererParams): void {
    this.url = params.value;
    this.naam = params.data.NAAM;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  showPopup() {
    this.popup.open();
  }
}
