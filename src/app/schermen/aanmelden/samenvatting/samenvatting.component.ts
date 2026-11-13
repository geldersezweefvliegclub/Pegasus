import { Component, inject, input, output, viewChild } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { HeliosAanwezigSamenvatting, HeliosDienstenDataset, HeliosRoosterDataset } from '../../../types/Helios';
import { DateTime } from 'luxon';
import { AanwezigLedenService } from '../../../services/apiservice/aanwezig-leden.service';
import { SharedService } from '../../../services/shared/shared.service';
import { LoginService } from '../../../services/apiservice/login.service';
import { PegasusConfigService } from '../../../services/shared/pegasus-config.service';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';

// lege namen van de diensten, wordt gebruikt om weergave te resetten
const LEGE_WEERGAVE = {
    ochtendDDI: "",
    ochtendInstructeur: "",
    ochtendStartleider: "",
    ochtendLierist: "",
    ochtendSleper: "",
    middagDDI: "",
    middagInstructeur: "",
    middagStartleider: "",
    middagLierist: "",
    middagSleper: "",
};

@Component({
    selector: 'app-samenvatting',
    templateUrl: './samenvatting.component.html',
    styleUrls: ['./samenvatting.component.scss'],
    imports: [ModalComponent, IconButtonComponent]
})
export class SamenvattingComponent {
    readonly diensten = input.required<HeliosDienstenDataset[]>();
    readonly bulkEmail = output<string>();

    // variablen in html formulier
    protected samenvatting: HeliosAanwezigSamenvatting | undefined;
    protected toonBulkEmail = false;
    protected formTitel: string;
    protected rooster: HeliosRoosterDataset;
    protected weergave = { ...LEGE_WEERGAVE };

    // private variable voor ts script
    private readonly sharedService = inject(SharedService);
    private readonly loginService = inject(LoginService);
    private readonly configService = inject(PegasusConfigService);
    private readonly aanwezigLedenService = inject(AanwezigLedenService);
    private readonly popup = viewChild.required(ModalComponent);

    openPopup(rooster: HeliosRoosterDataset) {
        const ui = this.loginService.userInfo;
        if (ui!.Userinfo!.isBeheerder || ui?.Userinfo!.isCIMT)
            this.toonBulkEmail = true;
        else {
            const diensten = this.diensten();
            if (!diensten) {
                this.toonBulkEmail = false;
            }
            // als de ingelode gebruiker dienst heeft, dan toegang tot bulk email
            const idx = diensten.findIndex((d) => {
                return (d.DATUM == rooster.DATUM && d.LID_ID == ui!.LidData!.ID)
            });
            this.toonBulkEmail = (idx >= 0);
        }

        this.formTitel = "Samenvatting " + this.sharedService.datumDMJ(rooster.DATUM!)

        this.rooster = rooster;
        this.samenvatting = undefined;

        this.aanwezigLedenService.getSamenvatting(DateTime.fromSQL(rooster.DATUM!)).then((s) => this.samenvatting = s);
        this.dienstNamen();
        this.popup().open();
    }

    // stuur alle aangemelde leden een email. Die hebben we alleen niet hier, maar 1 niveau hoger in aanmeld pagina
    protected sendBulkEmail() {
       const datum = this.rooster.DATUM;
       if (datum === undefined) {
           console.error("Kan bulk email niet versturen zonder rooster datum.");
           return;
       }
       this.bulkEmail.emit(datum);
    }

    // zet de namen van de diensten
    private dienstNamen() {
        this.weergave = { ...LEGE_WEERGAVE };

        const dagDiensten = this.diensten().filter((dienst) => dienst.DATUM == this.rooster.DATUM)

        dagDiensten.forEach((dienst) => {
            switch (dienst.TYPE_DIENST_ID) {
                case this.configService.OCHTEND_DDI_TYPE_ID:
                    this.weergave.ochtendDDI = dienst.NAAM!;
                    break;
                case this.configService.OCHTEND_INSTRUCTEUR_TYPE_ID:
                    this.weergave.ochtendInstructeur = dienst.NAAM!;
                    break;
                case this.configService.OCHTEND_LIERIST_TYPE_ID:
                    this.weergave.ochtendLierist = dienst.NAAM!;
                    break;
                // case this.configService.OCHTEND_HULPLIERIST_TYPE_ID:
                case this.configService.OCHTEND_STARTLEIDER_TYPE_ID:
                    this.weergave.ochtendStartleider = dienst.NAAM!;
                    break;
                // case this.configService.OCHTEND_STARTLEIDER_IO_TYPE_ID:
                case this.configService.MIDDAG_DDI_TYPE_ID:
                    this.weergave.middagDDI = dienst.NAAM!;
                    break;
                case this.configService.MIDDAG_INSTRUCTEUR_TYPE_ID:
                    this.weergave.middagInstructeur = dienst.NAAM!;
                    break;
                case this.configService.MIDDAG_LIERIST_TYPE_ID:
                    this.weergave.middagLierist = dienst.NAAM!;
                    break;
                // case this.configService.MIDDAG_HULPLIERIST_TYPE_ID:
                case this.configService.MIDDAG_STARTLEIDER_TYPE_ID:
                    this.weergave.middagStartleider = dienst.NAAM!;
                    break;
                // case this.configService.MIDDAG_STARTLEIDER_IO_TYPE_ID:
                case this.configService.SLEEPVLIEGER_TYPE_ID:
                    this.weergave.ochtendSleper = dienst.NAAM!;
                    break;
            }
        })
    }
}
