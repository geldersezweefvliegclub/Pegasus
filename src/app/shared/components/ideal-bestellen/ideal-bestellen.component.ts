import {Component, OnInit, ViewChild} from '@angular/core';
import {TransactiesService} from "../../../services/apiservice/transacties.service";
import {HeliosTransactiesBanken, HeliosType} from "../../../types/Helios";
import {ModalComponent} from "../modal/modal.component";
import {DdwvService} from "../../../services/apiservice/ddwv.service";
import {ErrorMessage} from "../../../types/Utils";
import {Subscription} from "rxjs";
import {TypesService} from "../../../services/apiservice/types.service";

@Component({
    selector: 'app-ideal-bestellen',
    templateUrl: './ideal-bestellen.component.html',
    styleUrls: ['./ideal-bestellen.component.scss']
})
export class IdealBestellenComponent implements OnInit{
    @ViewChild(ModalComponent) private popup: ModalComponent;

    private typesAbonnement: Subscription;
    bestelInfo: HeliosType[];

    banken: HeliosTransactiesBanken[] = [];

    error: ErrorMessage | undefined;

    lidID: number;
    bestelling: number = -1;
    bank: number = -1;

    constructor(private readonly ddwvService: DdwvService,
                private readonly typesService: TypesService,
                private readonly transactieService: TransactiesService) {
    }

    ngOnInit() {
        // abonneer op bestel info uit types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.bestelInfo = dataset!.filter((t:HeliosType) => { return t.GROEP == 21});
        });
    }

    openPopup(lidID: number) {
        this.transactieService.getBanken().then((b) => this.banken = b);

        this.lidID = lidID;
        this.popup.open();
    }

    bestellen() {
        this.transactieService.StartIDealTransactie(
            this.lidID,
            this.bestelling,
            this.banken[this.bank].ID!,
            window.location.href,
        ).then((url) => window.location.href = url).catch(e => {
            this.error = e;
        });
    }
}
