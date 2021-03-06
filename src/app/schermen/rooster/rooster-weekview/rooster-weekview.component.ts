import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {DagVanDeWeek} from "../../../utils/Utils";

import {
    HeliosLedenDatasetExtended,
    HeliosRoosterDagExtended,
    WeergaveData
} from "../rooster-page/rooster-page.component";
import {DienstenService} from "../../../services/apiservice/diensten.service";
import {LoginService} from "../../../services/apiservice/login.service";
import {HeliosDienst, HeliosDienstenDataset, HeliosLidData, HeliosType, HeliosUserinfo} from "../../../types/Helios";
import {Subscription} from "rxjs";
import {TypesService} from "../../../services/apiservice/types.service";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faCalendarCheck, faSortAmountDownAlt, faTimesCircle} from "@fortawesome/free-solid-svg-icons";
import {SharedService} from "../../../services/shared/shared.service";
import {DateTime} from "luxon";
import {StartEditorComponent} from "../../../shared/components/editors/start-editor/start-editor.component";
import {DienstEditorComponent} from "../../../shared/components/editors/dienst-editor/dienst-editor.component";

@Component({
    selector: 'app-rooster-weekview',
    templateUrl: './rooster-weekview.component.html',
    styleUrls: ['./rooster-weekview.component.scss']
})
export class RoosterWeekviewComponent implements OnInit, OnChanges,OnDestroy {
    @Input() rooster: HeliosRoosterDagExtended[];
    @Input() leden: HeliosLedenDatasetExtended[];
    @Input() datum: DateTime;
    @Input() tonen: WeergaveData;
    @Input() zelfIndelen: (dienstType: number, datum: string) => boolean;
    @Input() magVerwijderen: (dienstData: HeliosDienstenDataset) => boolean;
    @Input() lidInRoosterClass: (dienst: HeliosDienstenDataset) => string;
    @Output() nieuweDatum: EventEmitter<DateTime> = new EventEmitter<DateTime>();

    @ViewChild(DienstEditorComponent) dienstEditor: DienstEditorComponent;

    readonly resetIcon: IconDefinition = faTimesCircle;
    readonly assignIcon: IconDefinition = faCalendarCheck;

    private typesAbonnement: Subscription;
    dienstTypes: HeliosType[] = [];

    magWijzigen: boolean = false;
    dblKlik: boolean = false;

    maandag: DateTime;                          // De maandag van de gekozen week

    constructor(private readonly loginService: LoginService,
                private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService,
                readonly configService: PegasusConfigService,) {
    }

    ngOnInit(): void {
        const ui = this.loginService.userInfo;
        this.magWijzigen = (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isBeheerderDDWV || ui?.Userinfo?.isRooster) ? true : false;

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.dienstTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 18
            });    // type diensten
        });
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("datum")) {
            this.maandag = this.datum.startOf('week');     // de eerste dag van de gekozen week
        }
    }

    // Dit is al geimplementeerd in util.ts
    DagVanDeWeek(DATUM: string) {
        return DagVanDeWeek(DATUM);
    }

    // laat parent weten dat we een nieuwe week willen zien. Parent laadt de starts
    zetDatum(nieuweDatum: DateTime) {
        this.nieuweDatum.emit(nieuweDatum)
    }

    KolomBreedte():string {
        return `width: calc(100%/${this.rooster.length});`;
    }

    // Double klik werkt niet, maar enkel klik wel. Dan is de workarround een boolean en een timer
    openPopup(dag: HeliosRoosterDagExtended, typeDienstID: number) {
        if (this.dblKlik) { // er was al een keer geklikt
            this.dienstEditor.openPopup(dag, typeDienstID)
        }

        this.dblKlik = true;
        window.setTimeout(() => this.dblKlik = false, 350); // reset boolean na 350 msec
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
}
