import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-email-render',
  templateUrl: './email-render.component.html',
  styleUrls: ['./email-render.component.scss']
})
export class EmailRenderComponent implements AgRendererComponent {
  email: string;
  emailHref: string;

  faIcon: IconDefinition = faEnvelope

  constructor() { }

  agInit(params: ICellRendererParams): void {
    this.email = params.data.EMAIL;
    this.emailHref = "mailto:" + this.email;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
