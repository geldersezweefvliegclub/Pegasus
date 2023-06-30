import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {HeliosAanwezigSamenvatting, HeliosDienstenDataset, HeliosRoosterDataset,} from "../../../types/Helios";
import {DateTime} from "luxon";
import {AanwezigLedenService} from "../../../services/apiservice/aanwezig-leden.service";
import {SharedService} from "../../../services/shared/shared.service";
import {LoginService} from "../../../services/apiservice/login.service";
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";

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
    rooster: HeliosRoosterDataset;

    ochtendDDI: string = "";
    ochtendInstructeur: string = "";
    ochtendStartleider: string = "";
    ochtendLierist: string = "";
    ochtendSleper: string = "";

    middagDDI: string = "";
    middagInstructeur: string = "";
    middagStartleider: string = "";
    middagLierist: string = "";
    middagSleper: string = "";

    constructor(private readonly sharedService: SharedService,
                private readonly loginService: LoginService,
                private readonly configService: PegasusConfigService,
                private readonly aanwezigLedenService: AanwezigLedenService) {
    }

    openPopup(rooster: HeliosRoosterDataset) {
        const ui = this.loginService.userInfo;
        if (ui!.Userinfo!.isBeheerder || ui?.Userinfo!.isCIMT)
            this.toonBulkEmail = true;
        else {
            if (!this.diensten) {
                this.toonBulkEmail = false;
            }
            // als de ingelode gebruiker dienst heeft, dan toegang tot bulk email
            const idx = this.diensten.findIndex((d) => {
                return (d.DATUM == rooster.DATUM && d.LID_ID == ui!.LidData!.ID)
            });
            this.toonBulkEmail = (idx >= 0);
        }

        this.formTitel = "Samenvatting " + this.sharedService.datumDMJ(rooster.DATUM!)

        this.rooster = rooster;
        this.samenvatting = undefined;

        this.aanwezigLedenService.getSamenvatting(DateTime.fromSQL(rooster.DATUM!)).then((s) => this.samenvatting = s);
        this.dienstNamen();
        this.popup.open();
    }

    // stuur alle aangemelde leden een email. Die hebben we alleen niet hier, maar 1 niveau hoger in aanmeld pagina
    sendBulkEmail() {
       this.bulkEmail.emit(this.rooster.DATUM);
    }

    // zet de namen van de diensten
    dienstNamen() {
        this.ochtendDDI = "";
        this.ochtendInstructeur = "";
        this.ochtendStartleider = "";
        this.ochtendLierist = "";
        this.ochtendSleper = "";

        this.middagDDI = "";
        this.middagInstructeur = "";
        this.middagStartleider = "";
        this.middagLierist = "";
        this.middagSleper = "";

        const dagDiensten = this.diensten.filter((dienst) => dienst.DATUM == this.rooster.DATUM)

        console.log(this.diensten)
        dagDiensten.forEach((dienst) => {
            switch (dienst.TYPE_DIENST_ID) {
                case this.configService.OCHTEND_DDI_TYPE_ID:
                    this.ochtendDDI = dienst.NAAM!;
                    break;
                case this.configService.OCHTEND_INSTRUCTEUR_TYPE_ID:
                    this.ochtendInstructeur = dienst.NAAM!;
                    break;
                case this.configService.OCHTEND_LIERIST_TYPE_ID:
                    this.ochtendLierist = dienst.NAAM!;
                    break;
                // case this.configService.OCHTEND_HULPLIERIST_TYPE_ID:
                case this.configService.OCHTEND_STARTLEIDER_TYPE_ID:
                    this.ochtendStartleider = dienst.NAAM!;
                    break;
                // case this.configService.OCHTEND_STARTLEIDER_IO_TYPE_ID:
                case this.configService.MIDDAG_DDI_TYPE_ID:
                    this.middagDDI = dienst.NAAM!;
                    break;
                case this.configService.MIDDAG_INSTRUCTEUR_TYPE_ID:
                    this.middagInstructeur = dienst.NAAM!;
                    break;
                case this.configService.MIDDAG_LIERIST_TYPE_ID:
                    this.middagLierist = dienst.NAAM!;
                    break;
                // case this.configService.MIDDAG_HULPLIERIST_TYPE_ID:
                case this.configService.MIDDAG_STARTLEIDER_TYPE_ID:
                    this.middagStartleider = dienst.NAAM!;
                    break;
                // case this.configService.MIDDAG_STARTLEIDER_IO_TYPE_ID:
                case this.configService.SLEEPVLIEGER_TYPE_ID:
                    this.ochtendSleper = dienst.NAAM!;
                    break;
                // case this.configService.GASTEN_VLIEGER1_TYPE_ID:
                // case this.configService.GASTEN_VLIEGER2_TYPE_ID:
            }
        })
    }
}
