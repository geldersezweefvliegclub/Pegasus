import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
    selector: 'app-bedrag-render',
    templateUrl: './bedrag-render.component.html',
    styleUrls: ['./bedrag-render.component.scss']
})
export class BedragRenderComponent  {
    bedrag:number | undefined = undefined ;
    betaald:boolean | undefined = undefined ;

    constructor() {
    }

    agInit(params: ICellRendererParams): void {
        this.bedrag = params.value;
        this.betaald = params.data.BETAALD;
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}
