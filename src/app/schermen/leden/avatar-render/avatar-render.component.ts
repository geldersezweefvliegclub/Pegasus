import {Component} from '@angular/core';
import {AgRendererComponent} from 'ag-grid-angular';
import {ICellRendererParams} from 'ag-grid-community';

@Component({
  selector: 'app-avatar-render',
  templateUrl: './avatar-render.component.html',
  styleUrls: ['./avatar-render.component.scss']
})
export class AvatarRenderComponent implements AgRendererComponent {
  url: string;
  naam: string;

  agInit(params: ICellRendererParams): void {
    this.url = params.value;
    this.naam = params.data.NAAM;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
