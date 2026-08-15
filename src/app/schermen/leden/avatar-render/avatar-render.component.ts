import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
    selector: 'app-avatar-render',
    templateUrl: './avatar-render.component.html',
    styleUrls: ['./avatar-render.component.scss'],
    imports: [AvatarComponent]
})
export class AvatarRenderComponent implements AgRendererComponent {
  url: string;
  naam: string;

  agInit(params: ICellRendererParams): void {
    this.url = params.value;
    this.naam = params.data.NAAM;
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
