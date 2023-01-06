import {Component, OnInit, ViewChild} from '@angular/core';
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {HeliosAanwezigSamenvatting} from "../../../types/Helios";
import {DateTime} from "luxon";
import {DdwvService} from "../../../services/apiservice/ddwv.service";
import {AanwezigLedenService} from "../../../services/apiservice/aanwezig-leden.service";
import {SharedService} from "../../../services/shared/shared.service";

@Component({
    selector: 'app-samenvatting',
    templateUrl: './samenvatting.component.html',
    styleUrls: ['./samenvatting.component.scss']
})
export class SamenvattingComponent {
    @ViewChild(ModalComponent) private popup: ModalComponent;

    samenvatting: HeliosAanwezigSamenvatting | undefined;
    formTitel: string;

    constructor(private readonly sharedService: SharedService,
                private readonly aanwezigLedenService: AanwezigLedenService) {
    }

    openPopup(datum: string) {
        this.formTitel = "Samenvatting " + this.sharedService.datumDMJ(datum)

        this.samenvatting = undefined;
        this.aanwezigLedenService.getSamenvatting(DateTime.fromSQL(datum)).then((s) => this.samenvatting = s);
        this.popup.open();
    }
}
