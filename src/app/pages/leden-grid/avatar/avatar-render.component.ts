import {Component, ViewChild} from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";
import {ModalComponent} from "../../../shared/components/modal/modal.component";

@Component({
  selector: 'app-avatar-render',
  templateUrl: './avatar-render.component.html',
  styleUrls: ['./avatar-render.component.scss']
})
export class AvatarRenderComponent implements AgRendererComponent {
  url: string;
  naam: string;

  @ViewChild(ModalComponent) private popup: ModalComponent;

  constructor() { }

  agInit(params: ICellRendererParams): void {
    this.url = params.value;
    this.naam = params.data.NAAM;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  // Toon grote avatar in in popup window
  showPopup() {
    this.popup.open();
  }
}
