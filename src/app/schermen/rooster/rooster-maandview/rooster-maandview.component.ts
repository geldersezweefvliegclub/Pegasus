import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
    HeliosLedenDatasetExtended,
    HeliosRoosterDagExtended,
    WeergaveData
} from "../rooster-page/rooster-page.component";
import {CdkDrag, CdkDragDrop} from "@angular/cdk/drag-drop";
import {
    HeliosDienst, HeliosDienstenDataset,
    HeliosLedenDataset,
    HeliosLid,
    HeliosLidData, HeliosRoosterDag,
    HeliosRoosterDataset,
    HeliosType, HeliosUserinfo
} from "../../../types/Helios";
import {JaarTotalenComponent} from "../jaar-totalen/jaar-totalen.component";
import {DienstenService} from "../../../services/apiservice/diensten.service";
import {DagVanDeWeek} from "../../../utils/Utils";
import {LoginService} from "../../../services/apiservice/login.service";
import {Subscription} from "rxjs";
import {TypesService} from "../../../services/apiservice/types.service";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faCalendarCheck, faSortAmountDownAlt, faTimesCircle} from "@fortawesome/free-solid-svg-icons";
import {DateTime} from "luxon";
import {SharedService} from "../../../services/shared/shared.service";
import {DdwvService} from "../../../services/apiservice/ddwv.service";
import {UitbetalenDdwvCrewEditorComponent} from "../../../shared/components/editors/uitbetalen-ddwv-crew-editor/uitbetalen-ddwv-crew-editor.component";


@Component({
    selector: 'app-rooster-maandview',
    templateUrl: './rooster-maandview.component.html',
    styleUrls: ['./rooster-maandview.component.scss']
})
export class RoosterMaandviewComponent implements OnInit, OnDestroy {
    @Input() rooster: HeliosRoosterDagExtended[];
    @Input() leden:HeliosLedenDatasetExtended[];
    @Input() tonen: WeergaveData;
    @Input() zelfIndelen: (dienstType: number, datum: string) => boolean;
    @Input() magVerwijderen: (dienstData: HeliosDienstenDataset) => boolean;
    @Input() lidInRoosterClass: (dienst: HeliosDienstenDataset) => string;

    @ViewChild(JaarTotalenComponent) private jaarTotalen: JaarTotalenComponent;
    @ViewChild(UitbetalenDdwvCrewEditorComponent) private uitbetalen: UitbetalenDdwvCrewEditorComponent;

    readonly resetIcon: IconDefinition = faTimesCircle;
    readonly assignIcon: IconDefinition = faCalendarCheck;
    readonly iconSort: IconDefinition = faSortAmountDownAlt;

    private typesAbonnement: Subscription;
    dienstTypes: HeliosType[] = [];

    lidData: HeliosLidData;
    mijnID: string;
    mijnNaam: string;
    isCIMT: boolean;
    isDDWVCrew: boolean;
    isBeheerder: boolean;
    isBeheerderDDWV: boolean;
    magWijzigen: boolean = false;
    ddwvActief: boolean = true;
    dragDisabled: boolean = true;

    opslaanTimer: number;                           // kleine vertraging om starts opslaan te beperken

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
        this.lidData = ui!.LidData!;
        this.isCIMT = ui!.Userinfo?.isCIMT!;
        this.isDDWVCrew = ui!.LidData?.DDWV_CREW!;
        this.isBeheerder = ui!.LidData?.BEHEERDER!;
        this.isBeheerderDDWV = ui!.LidData?.DDWV_BEHEERDER!;
        this.dragDisabled = (ui!.Userinfo?.isRooster || this.isBeheerder || this.isBeheerderDDWV) ? false : true
        this.mijnID = (this.lidData.ID) ? this.lidData.ID.toString() : "-1";    // -1 mag nooit voorkomen, maar je weet het nooit
        this.mijnNaam = this.lidData.NAAM as string;

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

    KolomBreedte(factor=1) {
        if (this.tonen.DDWV) {
            return 'width: 50%'
        }

        let columns = 2;    // dag + opmerkingen
        if (this.tonen.Instructeurs) {
            columns += 2;
        }
        if (this.tonen.Startleiders) {
            columns++;
        }
        if (this.tonen.Lieristen) {
            columns += 2;
        }
        if (this.tonen.Sleepvliegers) {
            columns += 1;
        }
        const breedte = factor * 100 / columns;
        return 'width:' + breedte + '%';
    }

    // Het html id is een combinatie van datum en de dienst gescheiden door een comma.
    // Bijvoorbeeld 2021-12-01,1800
    decodeerID(id: string): { datum: string, typeDienst: number } {
        const splittedString = id.split(',');
        return {
            datum: splittedString[0],
            typeDienst: parseInt(splittedString[1])
        };
    }

    /**
     * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over lierist.
     * @param datum
     * @param dienst
     * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
     * @return {boolean}
     */
    lieristEvaluatie(datum: string, dienst: number, item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
        if (!this.dienstBeschikbaar(datum, dienst)) return false;
        return this.controleerGeschiktheid(item, datum, 'LIERIST');
    }

    /**
     * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over lierist.
     * @param datum
     * @param dienst
     * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
     * @return {boolean}
     */
    lioEvaluatie(datum: string, dienst: number, item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
        if (!this.dienstBeschikbaar(datum, dienst)) return false;
        return this.controleerGeschiktheid(item, datum, 'LIERIST_IO');
    }


    /**
     * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over instructeurs.
     * @param datum
     * @param dienst
     * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
     * @return {boolean}
     */
    instructeurEvaluatie(datum: string, dienst: number, item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
        if (!this.dienstBeschikbaar(datum, dienst)) return false;
        return this.controleerGeschiktheid(item, datum, 'INSTRUCTEUR');
    }

    /**
     * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over startleiders.
     * @param datum
     * @param dienst
     * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
     * @return {boolean}
     */
    startleiderEvaluatie(datum: string, dienst: number, item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
        if (!this.dienstBeschikbaar(datum, dienst)) return false;
        return this.controleerGeschiktheid(item, datum, 'STARTLEIDER');
    }

    /**
     * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over instructeurs.
     * @param datum
     * @param dienst
     * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
     * @return {boolean}
     */
    sleepvliegerEvaluatie(datum: string, dienst: number, item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
        if (!this.dienstBeschikbaar(datum, dienst)) return false;
        return this.controleerGeschiktheid(item, datum, 'SLEEPVLIEGER');
    }

    /**
     * Wordt in de template gebruikt om te controleren of iemand in een vakje gesleept mag worden. Gaat over instructeurs.
     * @param datum
     * @param dienst
     * @param {CdkDrag<HeliosLid | HeliosRoosterDataset>} item
     * @return {boolean}
     */
    gastVliegerEvaluatie(datum: string, dienst: number, item: CdkDrag<HeliosLid | HeliosRoosterDataset>): boolean {
        if (!this.dienstBeschikbaar(datum, dienst)) return false;
        return this.controleerGeschiktheid(item, datum, 'GASTENVLIEGER');
    }

    // voorkom dat ingevulde dienst overschreven wordt
    dienstBeschikbaar(datum: string, dienst: number): boolean {
        const roosterIndex = this.rooster.findIndex((dag => dag.DATUM == datum));

        if (roosterIndex < 0) {
            console.error("Datum " + datum + " onbekend");  // dat mag nooit voorkomen
            return false;
        }
        return (!this.rooster[roosterIndex].Diensten[dienst]);      // return false als dienst al toegekend is, leeg is return true
    }

    /**
     * Deze functie evalueert of de content een bepaalde rol is. Als dat zo is, returned hij true, anders false.
     * Als de meegegeven rol bijv. LIERIST is, kan een instructeur bijv. geen lieristdienst draaien.
     */
    controleerGeschiktheid(item: CdkDrag<HeliosLid | HeliosRoosterDataset>, datum: string, rol: 'LIERIST' | 'LIERIST_IO' | 'INSTRUCTEUR' | 'STARTLEIDER' | 'SLEEPVLIEGER' | 'GASTENVLIEGER'): boolean {
        // Content komt uit de ledenlijst of niet

        const roosterIndex = this.rooster.findIndex((dag => dag.DATUM == datum));

        if (roosterIndex < 0) {
            console.error("Datum " + datum + " onbekend");  // dat mag nooit voorkomen
            return false;
        }

        const ddwv = this.rooster[roosterIndex].DDWV && !this.rooster[roosterIndex].CLUB_BEDRIJF;  // alleen DDWV
        if (!this.magWijzigen && this.isBeheerderDDWV && this.rooster[roosterIndex].CLUB_BEDRIJF) { // DDWV beheerder doet alleen rooster voor DDWV dagen
            return false;
        }

        if (item.dropContainer.id === 'LEDENLIJST') {
            const data = item.data as HeliosLid;

            switch (rol) {
                case 'LIERIST':
                    return (ddwv) ? data.DDWV_CREW! : data.LIERIST!;
                case 'LIERIST_IO':
                    return data.LIERIST_IO! || data.LIERIST!;
                case 'INSTRUCTEUR':
                    return data.INSTRUCTEUR!;
                case 'SLEEPVLIEGER':
                    return data.SLEEPVLIEGER!;
                case 'STARTLEIDER':
                    return (ddwv) ? data.DDWV_CREW! : data.STARTLEIDER!;
                case 'GASTENVLIEGER':
                    return data.GASTENVLIEGER!;
            }
            return false;
        } else {
            const data = item.dropContainer.data;
            const oudeDienst = this.decodeerID(item.dropContainer.id);
            const lid = this.leden.find(lid => lid.ID === data.Diensten[oudeDienst.typeDienst].LID_ID);

            if (!lid) {
                console.error("Lid " + data.Diensten[oudeDienst.typeDienst].LID_ID + " onbekend");  // dat mag nooit voorkomen
                return false;
            }

            switch (rol) {
                case 'LIERIST':
                    return (ddwv) ? data.DDWV_CREW! : lid.LIERIST!;
                case 'LIERIST_IO':
                    return data.LIERIST_IO! || data.LIERIST!;
                case 'INSTRUCTEUR':
                    return lid.INSTRUCTEUR!;
                case 'SLEEPVLIEGER':
                    return data.SLEEPVLIEGER!;
                case 'STARTLEIDER':
                    return (ddwv) ? data.DDWV_CREW! : lid.STARTLEIDER!;
                case 'GASTENVLIEGER':
                    return data.GASTENVLIEGER!;
            }

            return false;
        }
    }

    onDropInLedenlijst(event: CdkDragDrop<HeliosLedenDataset[], any>): void {
        // De nieuwe container is hetzelfde als de vorige, doe dan niks.
        if (event.container === event.previousContainer) {
            return;
        } else {
            const data = event.item.dropContainer.data;
            const roosterDag = this.rooster.find(dag => dag.DATUM === data.DATUM);

            if (roosterDag) {
                this.toekennenDienst(roosterDag, this.decodeerID(event.item.dropContainer.id).typeDienst, undefined, undefined);
            }
        }
    }

    onDropInRooster(event: CdkDragDrop<HeliosLedenDataset, any>, roosterdag: HeliosRoosterDagExtended, typeDienstID: number): void {
        // Haal de nieuwe en oude ID's op. Een id is bijvoorbeeld:
        // 1800,0
        // 0 is de index in het rooster, dus de eerste dag van de maand.
        // OCHTEND_LIERIST is de dienst die te vervullen is.
        const nieuwContainerId = event.container.id;
        const oudContrainerId = event.previousContainer.id;

        // Als de nieuwe container hetzelfde is al de oude, doe dan niks.
        if (nieuwContainerId === oudContrainerId) {
            return;
        }

        // Als de actie van een container naar een andere container is geweest, controleren we eerst of de oude container de ledenlijst was of niet
        // De actie komt niet uit de ledenlijst, dus iemand is al ergens anders ingevuld.
        // Die moeten we eerst leegmaken, en dan kunnen we de nieuwe vullen.
        if (oudContrainerId == 'LEDENLIJST') {
            // De oude container is de ledenlijst geweest, dus dienst toevoegen
            const data = event.item.data;

            this.toekennenDienst(roosterdag, typeDienstID, data.ID, data.NAAM);
        } else {
            // We hebben van een dag naar een andere dag versleept dus starts zit op een andere locatie.
            // dienst aanpassen
            const oudeDienst = this.decodeerID(oudContrainerId)
            const roosterIndex = this.rooster.findIndex((dag => dag.DATUM == oudeDienst.datum));

            if (roosterIndex < 0) {
                console.error("Datum " + oudeDienst.datum + " onbekend");  // dat mag nooit voorkomen
                return;
            }

            // En omdat we starts verplaatsen, resetten vervolgens de dag waar we vandaan kwamen
            this.aanpassenDienst(this.rooster[roosterIndex], oudeDienst.typeDienst, roosterdag, typeDienstID);
        }
    }

    toekennenDienst(roosterdag: HeliosRoosterDagExtended, typeDienstID: number, lid_id: string | undefined, naam: string | undefined): void {
        const roosterIndex = this.rooster.findIndex((dag => dag.DATUM == roosterdag.DATUM));

        if (roosterIndex < 0) {
            console.error("Datum " + roosterdag.DATUM + " onbekend");  // dat mag nooit voorkomen
            return;
        }

        if (!roosterdag.Diensten[typeDienstID]) {  // nog niet eerder toegekend
            const nieuweDienst: HeliosDienst = {
                DATUM: roosterdag.DATUM,
                TYPE_DIENST_ID: typeDienstID,
                LID_ID: +lid_id!
            }

            this.dienstenService.addDienst(nieuweDienst).then(record => {
                this.rooster[roosterIndex].Diensten[typeDienstID] = record;
                this.rooster[roosterIndex].Diensten[typeDienstID].NAAM = naam;
            });

            // totalen aanpassen, maar alleen als we een clubdag hebben en sleepdiensten tellen niet mee
            if ((this.rooster[roosterIndex].CLUB_BEDRIJF) && (typeDienstID != this.configService.SLEEPVLIEGER_TYPE_ID)) {
                const ledenIndex = this.leden.findIndex((lid => lid.ID == lid_id));
                if (ledenIndex < 0) {
                    console.error("Lid " + lid_id + " onbekend");  // dat mag nooit voorkomen
                } else {
                    this.leden[ledenIndex].INGEDEELD_MAAND! += 1;
                    this.leden[ledenIndex].INGEDEELD_JAAR! += 1;
                }
            }
        } else {    // aanpassen bestaande dienst aanpassen
            this.rooster[roosterIndex].Diensten[typeDienstID]

            const gewijzigdeDienst: HeliosDienst = {
                ID: roosterdag.Diensten[typeDienstID].ID,
                DATUM: roosterdag.DATUM,
                TYPE_DIENST_ID: typeDienstID,
                LID_ID: +lid_id!
            }
            this.dienstenService.updateDienst(gewijzigdeDienst).then(record => {
                this.rooster[roosterIndex].Diensten[typeDienstID] = record;
                this.rooster[roosterIndex].Diensten[typeDienstID].NAAM = naam;
            });
        }
    }

    aanpassenDienst(oudeRoosterdag: HeliosRoosterDagExtended, oudeTypeDienstID: number, nieuweRoosterdag: HeliosRoosterDagExtended, nieuweTypeDienstID: number) {

        const gewijzigdeDienst: HeliosDienst = {
            ID: oudeRoosterdag.Diensten[oudeTypeDienstID].ID,
            LID_ID: oudeRoosterdag.Diensten[oudeTypeDienstID].LID_ID,
            DATUM: nieuweRoosterdag.DATUM,
            TYPE_DIENST_ID: nieuweTypeDienstID
        }

        this.dienstenService.updateDienst(gewijzigdeDienst).then(record => {
            nieuweRoosterdag.Diensten[nieuweTypeDienstID] = record;
            nieuweRoosterdag.Diensten[nieuweTypeDienstID].NAAM = oudeRoosterdag.Diensten[oudeTypeDienstID].NAAM;

            delete oudeRoosterdag.Diensten[oudeTypeDienstID];
        });
    }

    verwijderDienst(roosterdag: HeliosRoosterDagExtended, typeDienstID: number) {
        const roosterIndex = this.rooster.findIndex((dag => dag.DATUM == roosterdag.DATUM));

        if (roosterIndex < 0) {
            console.error("Datum " + roosterdag.DATUM + " onbekend");  // dat mag nooit voorkomen
            return false;
        }
        this.dienstenService.deleteDienst(roosterdag.Diensten[typeDienstID].ID!).then(() => delete this.rooster[roosterIndex].Diensten[typeDienstID]);

        // totalen aanpassen als het een clubdag is, sleepdiensten tellen niet mee
        if ((roosterdag.CLUB_BEDRIJF) && (typeDienstID != this.configService.SLEEPVLIEGER_TYPE_ID)) {
            const ledenIndex = this.leden.findIndex((lid => lid.ID == roosterdag.Diensten[typeDienstID].LID_ID));
            if (ledenIndex < 0) {
                console.error("Lid " + roosterdag.Diensten[typeDienstID].LID_ID + " onbekend");  // dat mag nooit voorkomen
            } else {
                this.leden[ledenIndex].INGEDEELD_MAAND! -= 1;
                this.leden[ledenIndex].INGEDEELD_JAAR! -= 1;
            }
        }
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

    toonRechts() {
        if (!this.magWijzigen && !this.isBeheerderDDWV) {
            return false;
        }

        if (window.innerWidth < 1400) {
            if (this.tonen.Instructeurs && this.tonen.Lieristen && this.tonen.Startleiders && this.tonen.Sleepvliegers) {
                return false;
            }
        }
        return true;
    }


    // laat zien hoe vaak een lid is ingedeeld voor het gekozen jaar
    toonJaarRooster(): void {
        this.jaarTotalen.openPopup();
    }

    // sorteer zodanig dat lid met minste diensten bovenaan staat
    sorteer() {
        this.leden.sort((a, b) => {
            if (a.INGEDEELD_JAAR == b.INGEDEELD_JAAR) {
                if (a.INGEDEELD_MAAND == b.INGEDEELD_MAAND) {
                    return a.NAAM!.localeCompare(b.NAAM!);
                }
                return (a.INGEDEELD_MAAND! > b.INGEDEELD_MAAND!) ? 1 : -1;
            }
            return (a.INGEDEELD_JAAR! > b.INGEDEELD_JAAR!) ? 1 : -1;
        })
    }


    // Dit is al geimplementeerd in util.ts
    DagVanDeWeek(DATUM: string) {
        return DagVanDeWeek(DATUM);
    }

    // Hebben we een datum in de toekomst, vandaag is geen toekomst
    datumInToekomst(datum: string): boolean {
        const nu: DateTime = DateTime.now();
        const d: DateTime = DateTime.fromSQL(datum);

        return (d > nu) // datum is in het toekomst
    }
}
