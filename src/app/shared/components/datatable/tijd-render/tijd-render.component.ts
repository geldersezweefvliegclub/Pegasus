import { Component, inject } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { SharedService } from '../../../../services/shared/shared.service';

// toont een ISO 8601 tijd in de grid als uu:mm
@Component({
    selector: 'app-tijd-render',
    template: '{{ tijd }}'
})
export class TijdRenderComponent implements AgRendererComponent {
    // variablen in html formulier
    protected tijd: string;

    // private variable voor ts script
    private readonly sharedService = inject(SharedService);

    agInit(params: ICellRendererParams): void {
        this.tijd = (params.value) ? this.sharedService.tijdHM(params.value) : "";
    }

    refresh(_: ICellRendererParams): boolean {
        return false;
    }
}
