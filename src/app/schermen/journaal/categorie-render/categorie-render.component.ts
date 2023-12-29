import {Component} from '@angular/core';
import {AgRendererComponent} from "ag-grid-angular";
import {ICellRendererParams} from "ag-grid-community";

@Component({
    selector: 'app-categorie-render',
    templateUrl: './categorie-render.component.html',
    styleUrls: ['./categorie-render.component.scss']
})

export class CategorieRenderComponent implements AgRendererComponent {
    categorie: string | undefined;
    id: number | undefined;

    constructor() {
    }

    agInit(params: ICellRendererParams): void {
        this.categorie = params.data.CATEGORIE_CODE;
        this.id = params.data.CATEGORIE_ID;
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}
