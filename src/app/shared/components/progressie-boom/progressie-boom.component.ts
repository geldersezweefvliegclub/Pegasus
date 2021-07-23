import {Component, Input, OnInit} from '@angular/core';
import {TreeviewItem, TreeviewConfig} from 'ngx-treeview';
import {StartlijstService} from "../../../services/apiservice/startlijst.service";
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import {HeliosProgressieBoom} from "../../../types/Helios";

@Component({
    selector: 'app-progressie-boom',
    templateUrl: './progressie-boom.component.html',
    styleUrls: ['./progressie-boom.component.scss']
})
export class ProgressieBoomComponent implements OnInit {
    @Input() VliegerID: number;

    boom: TreeviewItem[];
    values: number[];

    config = TreeviewConfig.create({
        hasAllCheckBox: false,
        hasFilter: true,
        hasCollapseExpand: true,
        decoupleChildFromParent: false,
        maxHeight: 400
    });

    constructor(private readonly progressieService: ProgressieService) {
    }

    ngOnInit(): void {
        this.ophalen();
    }

    ophalen(): void {
        this.progressieService.getBoom(this.VliegerID).then((b) => {
            this.boom = [];
            for (let i = 0; i < b.length; i++) {
                this.boom.push(this.TreeView(b[i]))
            }

        });
    }

    TreeView(boomTak: HeliosProgressieBoom): TreeviewItem{
        console.log(boomTak, boomTak.IS_BEHAALD == '1');

        let nieuwetak = new TreeviewItem({
            text: boomTak.ONDERWERP!.toString(),
            value: boomTak.COMPETENTIE_ID,
            collapsed: true
        });

        if (!boomTak.children) {
            nieuwetak.checked = boomTak.IS_BEHAALD == '2'
        }
        else {
            nieuwetak.disabled = true;

            for (let i=0 ; i < boomTak.children.length ; i++) {
                const extraTak:TreeviewItem = this.TreeView(boomTak.children[i]);   // recursion

                if (!nieuwetak.children) {
                    nieuwetak.children = [ extraTak ];  // creeer object en vullen
                }
                else {
                    nieuwetak.children.push(extraTak);  // voeg toe aan bestaand array
                }
            }
        }
        nieuwetak.correctChecked();
        return nieuwetak;
    }

    onFilterChange(value: string): void {
        console.log('filter:', value);
    }
}
