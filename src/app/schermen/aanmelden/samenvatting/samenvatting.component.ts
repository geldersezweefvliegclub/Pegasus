import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {
    HeliosAanwezigSamenvatting,
    HeliosDienstenDataset,
} from "../../../types/Helios";
import {DateTime} from "luxon";
import {AanwezigLedenService} from "../../../services/apiservice/aanwezig-leden.service";
import {SharedService} from "../../../services/shared/shared.service";
import {LoginService} from "../../../services/apiservice/login.service";

@Component({
    selector: 'app-samenvatting',
    templateUrl: './samenvatting.component.html',
    styleUrls: ['./samenvatting.component.scss']
})
export class SamenvattingComponent {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @Input() diensten: HeliosDienstenDataset[];
    @Output() bulkEmail: EventEmitter<string> = new EventEmitter<string>();

    samenvatting: HeliosAanwezigSamenvatting | undefined;
    toonBulkEmail: boolean = false;
    formTitel: string;
    datum: string;

    constructor(private readonly sharedService: SharedService,
                private readonly loginService: LoginService,
                private readonly aanwezigLedenService: AanwezigLedenService) {
    }

    openPopup(datum: string) {
        const ui = this.loginService.userInfo;
        if (ui!.Userinfo!.isBeheerder || ui?.Userinfo!.isCIMT)
            this.toonBulkEmail = true;
        else {
            if (!this.diensten) {
                this.toonBulkEmail = false;
            }
            // als de ingelode gebruiker dienst heeft, dan toegang tot bulk email
            const idx = this.diensten.findIndex((d) => {
                return (d.DATUM == datum && d.LID_ID == ui!.LidData!.ID)
            });
            this.toonBulkEmail = (idx >= 0);
        }

        this.formTitel = "Samenvatting " + this.sharedService.datumDMJ(datum)

        this.datum = datum;
        this.samenvatting = undefined;

        this.aanwezigLedenService.getSamenvatting(DateTime.fromSQL(datum)).then((s) => this.samenvatting = s);
        this.popup.open();
    }

    // stuur alle aangemelde leden een email. Die hebben we alleen niet hier, maar 1 niveau hoger in aanmeld pagina
    sendBulkEmail() {
       this.bulkEmail.emit(this.datum);
    }
}
