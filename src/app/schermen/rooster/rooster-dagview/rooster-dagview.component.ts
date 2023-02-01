import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {DagVanDeWeek} from "../../../utils/Utils";

import {
    HeliosLedenDatasetExtended,
    HeliosRoosterDagExtended,
    WeergaveData
} from "../rooster-page/rooster-page.component";
import {DienstenService} from "../../../services/apiservice/diensten.service";
import {LoginService} from "../../../services/apiservice/login.service";
import {
    HeliosDienst,
    HeliosDienstenDataset,
    HeliosRoosterDag,
    HeliosType,
} from "../../../types/Helios";
import {Subscription} from "rxjs";
import {TypesService} from "../../../services/apiservice/types.service";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faCalendarCheck, faTimesCircle} from "@fortawesome/free-solid-svg-icons";
import {SharedService} from "../../../services/shared/shared.service";
import {DateTime} from "luxon";
import {DienstEditorComponent} from "../../../shared/components/editors/dienst-editor/dienst-editor.component";
import {DdwvService} from "../../../services/apiservice/ddwv.service";
import {UitbetalenDdwvCrewEditorComponent} from "../../../shared/components/editors/uitbetalen-ddwv-crew-editor/uitbetalen-ddwv-crew-editor.component";

@Component({
    selector: 'app-rooster-dagview',
    templateUrl: './rooster-dagview.component.html',
    styleUrls: ['./rooster-dagview.component.scss']
})
export class RoosterDagviewComponent implements OnInit, OnDestroy {
    @Input() rooster: HeliosRoosterDagExtended[];
    @Input() leden: HeliosLedenDatasetExtended[];
    @Input() datum: DateTime;
    @Input() tonen: WeergaveData;
    @Input() zelfIndelen: (dienstType: number, datum: string) => boolean;
    @Input() magVerwijderen: (dienstData: HeliosDienstenDataset) => boolean;
    @Input() lidInRoosterClass: (dienst: HeliosDienstenDataset) => string;
    @Output() nieuweDatum: EventEmitter<DateTime> = new EventEmitter<DateTime>();

    @ViewChild(DienstEditorComponent) dienstEditor: DienstEditorComponent;
    @ViewChild(UitbetalenDdwvCrewEditorComponent) private uitbetalen: UitbetalenDdwvCrewEditorComponent;

    readonly resetIcon: IconDefinition = faTimesCircle;
    readonly assignIcon: IconDefinition = faCalendarCheck;

    private typesAbonnement: Subscription;
    dienstTypes: HeliosType[] = [];

    ddwvActief: boolean = true;
    isBeheerder: boolean;
    isBeheerderDDWV: boolean;
    magWijzigen: boolean = false;
    isCIMT: boolean;
    dblKlik: boolean = false;

    opslaanTimer: number;                       // kleine vertraging om starts opslaan te beperken

    constructor(private readonly ddwvService: DdwvService,
                private readonly loginService: LoginService,
                private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService,
                readonly configService: PegasusConfigService) {
    }

    ngOnInit(): void {
        const ui = this.loginService.userInfo;
        this.isCIMT = ui!.Userinfo?.isCIMT!;
        this.isBeheerder = ui!.LidData?.BEHEERDER!;
        this.isBeheerderDDWV = ui!.LidData?.DDWV_BEHEERDER!;
        this.magWijzigen = (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isRooster) ? true : false;

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.dienstTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 18
            });    // type diensten
        });

        this.ddwvActief = this.ddwvService.actief();
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
    }

    // Dit is al geimplementeerd in util.ts
    DagVanDeWeek(DATUM: string) {
        return DagVanDeWeek(DATUM);
    }

    // laat parent weten dat we een nieuwe week willen zien. Parent laadt de starts
    zetDatum(nieuweDatum: DateTime) {
        this.nieuweDatum.emit(nieuweDatum)
    }

    // Double klik werkt niet, maar enkel klik wel. Dan is de workarround een boolean en een timer
    openPopup(dag: HeliosRoosterDagExtended, typeDienstID: number) {
        if (!dag.DDWV && !dag.CLUB_BEDRIJF) { return}  // geen vliegdag
        if (!this.magWijzigen && !this.isBeheerderDDWV) { return }  // gebruiker mag niet wijzigen
        if (!this.magWijzigen && this.isBeheerderDDWV && dag.CLUB_BEDRIJF ) {   // DDWV beheer maakt geen rooster voor clubdag
            return
        }

        if (this.dblKlik) { // er was al een keer geklikt
            this.dienstEditor.openPopup(dag, typeDienstID)
        }

        this.dblKlik = true;
        window.setTimeout(() => this.dblKlik = false, 350); // reset boolean na 350 msec
    }

    opslaanRooster(datum: string) {
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
            MIN_SLEEPSTART: ingevoerd.MIN_SLEEPSTART,
            MIN_LIERSTART: ingevoerd.MIN_LIERSTART,
            OPMERKINGEN: ingevoerd.OPMERKINGEN
        }

        // Wacht even de gebruiker kan nog aan het typen zijn
        this.opslaanTimer = window.setTimeout(() => {
            this.roosterService.updateRoosterdag(rooster);
        }, 1000);
    }

    toekennenDienst(roosterdag: HeliosRoosterDagExtended, typeDienstID: number): void {
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

    verwijderDienst(roosterdag: HeliosRoosterDagExtended, typeDienstID: number) {
        const roosterIndex = this.rooster.findIndex((dag => dag.DATUM == roosterdag.DATUM));

        if (roosterIndex < 0) {
            console.error("Datum " + roosterdag.DATUM + " onbekend");  // dat mag nooit voorkomen
            return false;
        }
        this.dienstenService.deleteDienst(roosterdag.Diensten[typeDienstID].ID!).then(() => delete this.rooster[roosterIndex].Diensten[typeDienstID]);
    }

    lidInRoosterDagClass(dienst: HeliosDienstenDataset, dag: any) {
        return (dag.CLUB_BEDRIJF || dag.DDWV) ? this.lidInRoosterClass(dienst) : "blanco";
    }

    // Hebben we een datum in de toekomst, vandaag is geen toekomst
    datumInToekomst(datum: string): boolean {
        const nu: DateTime = DateTime.now();
        const d: DateTime = DateTime.fromSQL(datum);

        return (d > nu) // datum is in het toekomst
    }
}
