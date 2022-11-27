import {Component, OnInit, ViewChild} from '@angular/core';
import {BankIDeal, TransactiesService} from "../../../services/apiservice/transacties.service";
import {HeliosBestelInfo} from "../../../types/Helios";
import {ModalComponent} from "../modal/modal.component";
import {DdwvService} from "../../../services/apiservice/ddwv.service";

@Component({
    selector: 'app-ideal-bestellen',
    templateUrl: './ideal-bestellen.component.html',
    styleUrls: ['./ideal-bestellen.component.scss']
})
export class IdealBestellenComponent implements OnInit {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    bestelInfo: HeliosBestelInfo[] = [];
    banken: BankIDeal[] = [];

    lidID: number;
    bestelling: number = -1;
    bank: number = -1;

    constructor(private readonly ddwvService: DdwvService,
                private readonly transactieService: TransactiesService) {
    }

    ngOnInit(): void {
    }

    openPopup(lidID: number) {
        this.bestelInfo = this.ddwvService.getBestelInfo();

        this.transactieService.getBanken().then((b) => this.banken = b);
        this.lidID = lidID;
        this.popup.open();
    }

    opslaan() {}
}
