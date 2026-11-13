import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, input, output, viewChild } from '@angular/core';
import { DagVanDeWeek } from '../../../utils/Utils';

import {
  HeliosLedenDatasetExtended,
  HeliosRoosterDagExtended,
  WeergaveData,
} from '../rooster-page/rooster-page.component';
import { DienstenService } from '../../../services/apiservice/diensten.service';
import { LoginService } from '../../../services/apiservice/login.service';
import { HeliosDienst, HeliosDienstenDataset, HeliosRoosterDag } from '../../../types/Helios';
import { RoosterService } from '../../../services/apiservice/rooster.service';
import { PegasusConfigService } from '../../../services/shared/pegasus-config.service';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faCalendarCheck, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { DateTime } from 'luxon';
import { DienstEditorComponent } from '../../../shared/components/editors/dienst-editor/dienst-editor.component';
import {
  UitbetalenDdwvCrewEditorComponent,
} from '../../../shared/components/editors/uitbetalen-ddwv-crew-editor/uitbetalen-ddwv-crew-editor.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { NgClass, NgTemplateOutlet, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-rooster-weekview',
    templateUrl: './rooster-weekview.component.html',
    styleUrls: ['./rooster-weekview.component.scss'],
    imports: [UitbetalenDdwvCrewEditorComponent, IconButtonComponent, NgClass, FormsModule, NgTemplateOutlet, FaIconComponent, DienstEditorComponent, SlicePipe]
})
export class RoosterWeekviewComponent implements OnInit, OnChanges,OnDestroy {
    @Input() rooster: HeliosRoosterDagExtended[];
    readonly leden = input.required<HeliosLedenDatasetExtended[]>();
    readonly datum = input.required<DateTime>();
    readonly tonen = input.required<WeergaveData>();
    readonly zelfIndelen = input.required<(dienstType: number, datum: string) => boolean>();
    readonly magVerwijderen = input.required<(dienstData: HeliosDienstenDataset) => boolean>();
    readonly lidInRoosterClass = input.required<(dienst: HeliosDienstenDataset) => string>();
    readonly nieuweDatum = output<DateTime>();

    // variablen in html formulier
    protected readonly configService = inject(PegasusConfigService);
    protected readonly uitbetalen = viewChild.required(UitbetalenDdwvCrewEditorComponent);
    protected readonly resetIcon: IconDefinition = faTimesCircle;
    protected readonly assignIcon: IconDefinition = faCalendarCheck;

    protected isBeheerderDDWV: boolean;
    protected isBeheerder: boolean;
    protected magWijzigen = false;
    protected isCIMT: boolean;
    protected maandag: DateTime;                          // De maandag van de gekozen week

    // private variable voor ts script
    private readonly loginService = inject(LoginService);
    private readonly roosterService = inject(RoosterService);
    private readonly dienstenService = inject(DienstenService);
    private readonly dienstEditor = viewChild.required(DienstEditorComponent);

    private dblKlik = false;
    private opslaanTimer: number;

    ngOnInit(): void {
        const ui = this.loginService.userInfo;
        this.isCIMT = ui?.Userinfo?.isCIMT ?? false;
        this.isBeheerder = ui?.LidData?.BEHEERDER ?? false;
        this.isBeheerderDDWV = ui?.Userinfo?.isBeheerderDDWV ?? false;
        this.magWijzigen = (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isRooster) ? true : false;


    }

    ngOnDestroy(): void {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (Object.prototype.hasOwnProperty.call(changes, "datum")) {
            this.maandag = this.datum().startOf('week');     // de eerste dag van de gekozen week
        }
    }

    // Dit is al geimplementeerd in util.ts
    protected DagVanDeWeek(DATUM: string) {
        return DagVanDeWeek(DATUM);
    }

    // laat parent weten dat we een nieuwe week willen zien. Parent laadt de starts
    protected zetDatum(nieuweDatum: DateTime) {
        this.nieuweDatum.emit(nieuweDatum)
    }

    protected KolomBreedte():string {
        return `width: calc(100%/${this.rooster.length});`;
    }

    // Double klik werkt niet, maar enkel klik wel. Dan is de workarround een boolean en een timer
    protected openPopup(dag: HeliosRoosterDagExtended, typeDienstID: number) {
        if (!dag.DDWV && !dag.CLUB_BEDRIJF) { return}  // geen vliegdag
        if (!this.magWijzigen && !this.isBeheerderDDWV) { return }  // gebruiker mag niet wijzigen
        if (!this.magWijzigen && this.isBeheerderDDWV && dag.CLUB_BEDRIJF ) {   // DDWV beheer maakt geen rooster voor clubdag
            return
        }

        if (this.dblKlik) { // er was al een keer geklikt
            this.dienstEditor().openPopup(dag, typeDienstID)
        }

        this.dblKlik = true;
        window.setTimeout(() => this.dblKlik = false, 350); // reset boolean na 350 msec
    }

    protected opslaanRooster(datum: string) {
        clearTimeout(this.opslaanTimer);
        const roosterIndex = this.rooster.findIndex((dag => dag.DATUM == datum));

        if (roosterIndex < 0) {
            console.error("Datum " + datum + " onbekend");  // dat mag nooit voorkomen
            return;
        }

        const ingevoerd = this.rooster[roosterIndex]
        const rooster: HeliosRoosterDag = {
            ID: ingevoerd.ID,
            DDWV: ingevoerd.DDWV,
            CLUB_BEDRIJF: ingevoerd.CLUB_BEDRIJF,
            WINTER_WERK: ingevoerd.WINTER_WERK,
            MIN_SLEEPSTART: ingevoerd.MIN_SLEEPSTART,
            MIN_LIERSTART: ingevoerd.MIN_LIERSTART,
            OPMERKINGEN: ingevoerd.OPMERKINGEN
        }

        // Wacht even de gebruiker kan nog aan het typen zijn
        this.opslaanTimer = window.setTimeout(() => {
            this.roosterService.updateRoosterdag(rooster);
        }, 1000);
    }

    protected toekennenDienst(roosterdag: HeliosRoosterDagExtended, typeDienstID: number): void {
        const roosterIndex = this.rooster.findIndex((dag => dag.DATUM == roosterdag.DATUM));

        if (roosterIndex < 0) {
            console.error("Datum " + roosterdag.DATUM + " onbekend");  // dat mag nooit voorkomen
            return;
        }

        const ui = this.loginService.userInfo;

        const nieuweDienst: HeliosDienst = {
            DATUM: roosterdag.DATUM,
            TYPE_DIENST_ID: typeDienstID,
            LID_ID: ui!.LidData!.ID
        }
        this.dienstenService.addDienst(nieuweDienst)
    }

    protected verwijderDienst(roosterdag: HeliosRoosterDagExtended, typeDienstID: number) {
        const roosterIndex = this.rooster.findIndex((dag => dag.DATUM == roosterdag.DATUM));

        if (roosterIndex < 0) {
            console.error("Datum " + roosterdag.DATUM + " onbekend");  // dat mag nooit voorkomen
            return false;
        }
        this.dienstenService.deleteDienst(roosterdag.Diensten[typeDienstID].ID!).then(() => delete this.rooster[roosterIndex].Diensten[typeDienstID]);
    }

    protected lidInRoosterDagClass(dienst: HeliosDienstenDataset, dag: HeliosRoosterDag) {
        return (dag.CLUB_BEDRIJF || dag.DDWV) ? this.lidInRoosterClass()(dienst) : "blanco";
    }

    // Hebben we een datum in de toekomst, vandaag is geen toekomst
    protected datumInToekomst(datum: string): boolean {
        const nu: DateTime = DateTime.now();
        const d: DateTime = DateTime.fromSQL(datum);

        return (d > nu) // datum is in het toekomst
    }
}
