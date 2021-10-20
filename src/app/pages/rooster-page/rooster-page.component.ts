import {Component, OnInit, ViewChild} from '@angular/core';
import {CdkDrag, CdkDragDrop} from '@angular/cdk/drag-drop';
import {LedenService} from '../../services/apiservice/leden.service';
import {
    HeliosDienst, HeliosDienstenDataset,
    HeliosLedenDataset,
    HeliosLid,
    HeliosRoosterDag,
    HeliosRoosterDataset, HeliosType
} from '../../types/Helios';
import {
    faCalendarCheck,
    faCalendarDay,
    faSortAmountDownAlt,
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import {SharedService} from '../../services/shared/shared.service';
import {Subscription} from 'rxjs';
import {RoosterService} from '../../services/apiservice/rooster.service';
import {DateTime} from 'luxon';
import {LedenFilterComponent} from "../../shared/components/leden-filter/leden-filter.component";
import {LoginService} from "../../services/apiservice/login.service";
import {DienstenService} from "../../services/apiservice/diensten.service";
import * as xlsx from "xlsx";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {TypesService} from "../../services/apiservice/types.service";
import {JaarTotalenComponent} from "./jaar-totalen/jaar-totalen.component";
import {PegasusConfigService} from "../../services/shared/pegasus-config.service";

type HeliosLedenDatasetExtended = HeliosLedenDataset & {
    INGEDEELD_MAAND?: number
    INGEDEELD_JAAR?: number
}

type HeliosRoosterDagExtended = HeliosRoosterDag & {
    Diensten: HeliosDienstenDataset[];
}


@Component({
    selector: 'app-rooster-page',
    templateUrl: './rooster-page.component.html',
    styleUrls: ['./rooster-page.component.scss']
})
export class RoosterPageComponent implements OnInit {
    @ViewChild(LedenFilterComponent) ledenFilter: LedenFilterComponent;
    @ViewChild(JaarTotalenComponent) private jaarTotalen: JaarTotalenComponent;

    readonly roosterIcon: IconDefinition = faCalendarDay;
    readonly resetIcon: IconDefinition = faTimesCircle;
    readonly assignIcon: IconDefinition = faCalendarCheck;
    readonly iconSort: IconDefinition = faSortAmountDownAlt;

    readonly OCHTEND_DDI_TYPE_ID = 1800;
    readonly OCHTEND_INSTRUCTEUR_TYPE_ID = 1801;
    readonly OCHTEND_LIERIST_TYPE_ID = 1802;
    readonly OCHTEND_HULPLIERIST_TYPE_ID = 1803;
    readonly OCHTEND_STARTLEIDER_TYPE_ID = 1804;
    readonly MIDDAG_DDI_TYPE_ID = 1805;
    readonly MIDDAG_INSTRUCTEUR_TYPE_ID = 1806;
    readonly MIDDAG_LIERIST_TYPE_ID = 1807;
    readonly MIDDAG_HULPLIERIST_TYPE_ID = 1808;
    readonly MIDDAG_STARTLEIDER_TYPE_ID = 1809;

    private readonly MaxDienstenPerMaand = 2;

    toonStartleiders = true;
    toonInstructeurs = true;
    toonLieristen = true;
    toonDDWV = false;
    toonTotalen = false

    typesAbonnement: Subscription;
    dienstTypes: HeliosType[] = [];
    isStartleider: boolean = false;
    isInstructeur: boolean = false;
    isLierist: boolean = false;
    isDDWVCrew: boolean = false;
    isDDWVer: boolean = false;
    isCIMT: boolean = false;

    toonClubDDWV: number = 1;            // 0, gehele week, 1 = club dagen, 2 = alleen DDWV

    ledenAbonnement: Subscription;
    alleLeden: HeliosLedenDatasetExtended[];
    filteredLeden: HeliosLedenDatasetExtended[];

    dienstenAbonnement: Subscription;
    diensten: HeliosDienstenDataset[];

    roosterAbonnement: Subscription;
    rooster: HeliosRoosterDataset[];

    heleRooster: HeliosRoosterDagExtended[];        // combinatie rooster & diensten
    filteredRooster: HeliosRoosterDagExtended[];    // combinatie rooster & diensten, welke getoond worden

    datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag

    magExporteren: boolean = true;
    magWijzigen: boolean = false;
    opslaanTimer: number;                  // kleine vertraging om data opslaan te beperken
    isLoading: number = 0;
    zoekString: string;

    mijnID: string;
    mijnNaam: string;

    constructor(private readonly loginService: LoginService,
                private readonly ledenService: LedenService,
                private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly configService: PegasusConfigService,
                private readonly dienstenService: DienstenService,
                private readonly roosterService: RoosterService) {
    }

    ngOnInit(): void {
        const ui = this.loginService.userInfo;
        this.magWijzigen = (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isBeheerderDDWV || ui?.Userinfo?.isRooster) ? true : false;
        this.magExporteren = !ui?.Userinfo?.isDDWV;
        this.isLierist = ui?.LidData?.LIERIST as boolean
        this.isStartleider = ui?.LidData?.STARTLEIDER as boolean;
        this.isInstructeur = ui?.LidData?.INSTRUCTEUR as boolean;
        this.isDDWVCrew = ui?.LidData?.DDWV_CREW as boolean;
        this.isCIMT = ui?.Userinfo?.isCIMT as boolean;

        this.isDDWVer = (this.loginService.userInfo?.Userinfo?.isDDWV!);
        if (this.isDDWVer) {
            this.toonClubDDWV = 2;   // Alleen DDWV
        }

        this.toonTotalen = (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isCIMT || ui?.Userinfo?.isRooster) ? true : false;

        this.mijnID = (ui?.LidData?.ID) ? ui?.LidData?.ID.toString() : "-1";    // -1 mag nooit voorkomen, maar je weet het nooit
        this.mijnNaam = ui?.LidData?.NAAM as string;

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })
            if (this.alleLeden) {       // eerst moeten de leden geladen zijn
                setTimeout(() => this.opvragenTotalen(), 200);  // kleine vertraging, opvragen Rooster heeft prioriteit
            }

            // maak scherm leeg en laat spinner zien
            this.heleRooster = []
            this.filteredRooster = []
            this.isLoading = 2;
        })

        // abonneer op wijziging van rooster
        this.roosterAbonnement = this.roosterService.roosterChange.subscribe(maandRooster => {
            this.rooster = maandRooster!
            this.isLoading--;               // Deze is klaar met laden
            this.maandRooster()
        });

        // abonneer op wijziging van diensten
        this.dienstenAbonnement = this.dienstenService.dienstenChange.subscribe(diensten => {
            this.diensten = diensten!;
            this.isLoading--;               // Deze is klaar met laden
            this.maandRooster()
            this.maandTotaalUser()
        });

        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.alleLeden = (leden) ? leden : [];
            for (let i = 0; i < this.alleLeden.length; i++) {
                this.alleLeden[i].INGEDEELD_MAAND = 0;
                this.alleLeden[i].INGEDEELD_JAAR = 0;
            }
            this.applyLedenFilter();
            this.opvragenTotalen();
        });

        // abonneer op wijziging van types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.dienstTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 18});    // type diensten
        });
    }

    private opvragenTotalen() {
        if (!this.toonTotalen) {
            this.maandTotaalUser()
        }
        else {
            this.dienstenService.getTotalen(this.datum.year).then(totalen => {
                this.alleLeden.forEach(lid => {
                    const maandIndex = totalen.findIndex((maand => maand.LID_ID == lid.ID && maand.MAAND == this.datum.month));

                    if (maandIndex < 0) {
                        lid.INGEDEELD_MAAND = 0;
                    } else {
                        lid.INGEDEELD_MAAND = totalen[maandIndex].AANTAL;
                    }

                    const jaarIndex = totalen.findIndex((maand => maand.LID_ID == lid.ID && maand.MAAND == null));    // maand = null = gehele jaar
                    if (jaarIndex < 0) {
                        lid.INGEDEELD_JAAR = 0;
                    } else {
                        lid.INGEDEELD_JAAR = totalen[jaarIndex].AANTAL;
                    }
                });
            });
        }
    }

    private maandRooster() {
        const maandRooster: HeliosRoosterDagExtended[] = (this.rooster as HeliosRoosterDagExtended[]);

        maandRooster.forEach(dag => {
            dag.Diensten = [];              // placeholder, gaan het vullen waar nodig

            if (this.diensten) {
                const diensten: HeliosDienstenDataset[] = this.diensten.filter((dienst) => dienst.DATUM == dag.DATUM)
                diensten.forEach((dienst) => dag.Diensten[dienst.TYPE_DIENST_ID!] = dienst)
            }
        });

        this.heleRooster = JSON.parse(JSON.stringify(maandRooster));
        this.applyRoosterFilter();
    }

    /**
     * Bepaal aantal diensten van deze maand voor de ingelogde gebruiker. Totalen API wordt niet gebruikt voor normale gebruikers,
     * maar alleen voor roostermakers, beheerders. Totaal voor de maand is belangrijk om zelf te kunnen indelen
     * Je mag hezelf maar beperkt indelen
     * @private
     */
    private maandTotaalUser() {
        if (this.alleLeden) {
            const lid = this.alleLeden.find((l) => (l.ID?.toString() == this.mijnID));

            if (lid) {
                const lidDiensten = this.diensten.filter((dienst) => dienst.LID_ID!.toString() == this.mijnID);
                lid.INGEDEELD_MAAND = lidDiensten.length;
            }
        }
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

    // voorkom dat ingevulde dienst overschreven wordt
    dienstBeschikbaar(datum: string, dienst: number): boolean {
        const roosterIndex = this.heleRooster.findIndex((dag => dag.DATUM == datum));

        if (roosterIndex < 0) {
            console.error("Datum " + datum + " onbekend");  // dat mag nooit voorkomen
            return false;
        }
        return (!this.heleRooster[roosterIndex].Diensten[dienst]);      // return false als dienst al toegekend is, leeg is return true
    }

    /**
     * Deze functie evalueert of de content een bepaalde rol is. Als dat zo is, returned hij true, anders false.
     * Als de meegegeven rol bijv. LIERIST is, kan een instructeur bijv. geen lieristdienst draaien.
     */
    controleerGeschiktheid(item: CdkDrag<HeliosLid | HeliosRoosterDataset>, datum: string, rol: 'LIERIST' | 'INSTRUCTEUR' | 'STARTLEIDER'): boolean {
        // Content komt uit de ledenlijst of niet

        const roosterIndex = this.heleRooster.findIndex((dag => dag.DATUM == datum));

        if (roosterIndex < 0) {
            console.error("Datum " + datum + " onbekend");  // dat mag nooit voorkomen
            return false;
        }
        const ddwv = this.heleRooster[roosterIndex].DDWV && !this.heleRooster[roosterIndex].CLUB_BEDRIJF;  // alleen DDWV

        if (item.dropContainer.id === 'LEDENLIJST') {
            const data = item.data as HeliosLid;

            switch (rol) {
                case 'LIERIST':
                    return (ddwv) ? data.DDWV_CREW! : data.LIERIST!;
                case 'INSTRUCTEUR':
                    return data.INSTRUCTEUR!;
                case 'STARTLEIDER':
                    return (ddwv) ? data.DDWV_CREW! : data.STARTLEIDER!;
            }
            return false;
        } else {
            const data = item.dropContainer.data;
            const oudeDienst = this.decodeerID(item.dropContainer.id);
            const lid = this.alleLeden.find(lid => lid.ID === data.Diensten[oudeDienst.typeDienst].LID_ID);

            if (!lid) {
                console.error("Lid " + data.Diensten[oudeDienst.typeDienst].LID_ID + " onbekend");  // dat mag nooit voorkomen
                return false;
            }

            switch (rol) {
                case 'LIERIST':
                    return (ddwv) ? data.DDWV_CREW! : lid.LIERIST!;
                case 'INSTRUCTEUR':
                    return lid.INSTRUCTEUR!;
                case 'STARTLEIDER':
                    return (ddwv) ? data.DDWV_CREW! : lid.STARTLEIDER!;
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
            const roosterDag = this.filteredRooster.find(dag => dag.DATUM === data.DATUM);

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
            // We hebben van een dag naar een andere dag versleept dus data zit op een andere locatie.
            // dienst aanpassen
            const oudeDienst = this.decodeerID(oudContrainerId)
            const roosterIndex = this.heleRooster.findIndex((dag => dag.DATUM == oudeDienst.datum));

            if (roosterIndex < 0) {
                console.error("Datum " + oudeDienst.datum + " onbekend");  // dat mag nooit voorkomen
                return;
            }

            // En omdat we data verplaatsen, resetten vervolgens de dag waar we vandaan kwamen
            this.aanpassenDienst(this.heleRooster[roosterIndex], oudeDienst.typeDienst, roosterdag, typeDienstID);
        }
    }

    opslaanRooster(datum: string) {
        clearTimeout(this.opslaanTimer);
        const roosterIndex = this.heleRooster.findIndex((dag => dag.DATUM == datum));

        if (roosterIndex < 0) {
            console.error("Datum " + datum + " onbekend");  // dat mag nooit voorkomen
            return;
        }

        const ingevoerd = this.heleRooster[roosterIndex]
        const rooster: HeliosRoosterDag = {
            ID: ingevoerd.ID,
            DDWV: ingevoerd.DDWV,
            CLUB_BEDRIJF: ingevoerd.CLUB_BEDRIJF,
            OPMERKINGEN: ingevoerd.OPMERKINGEN
        }

        // Wacht even de gebruiker kan nog aan het typen zijn
        this.opslaanTimer = window.setTimeout(() => {
            this.roosterService.updateRoosterdag(rooster);
        }, 1000);
    }

    toekennenDienst(roosterdag: HeliosRoosterDagExtended, typeDienstID: number, lid_id: string | undefined, naam: string | undefined): void {
        const roosterIndex = this.heleRooster.findIndex((dag => dag.DATUM == roosterdag.DATUM));

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
                this.heleRooster[roosterIndex].Diensten[typeDienstID] = record;
                this.heleRooster[roosterIndex].Diensten[typeDienstID].NAAM = naam;
            });

            // totalen aanpassen, maar alleen als we een clubdag hebben
            if (this.heleRooster[roosterIndex].CLUB_BEDRIJF) {
                const ledenIndex = this.alleLeden.findIndex((lid => lid.ID == lid_id));
                if (ledenIndex < 0) {
                    console.error("Lid " + lid_id + " onbekend");  // dat mag nooit voorkomen
                } else {
                    this.alleLeden[ledenIndex].INGEDEELD_MAAND! += 1;
                    this.alleLeden[ledenIndex].INGEDEELD_JAAR! += 1;
                }
            }
        } else {    // aanpassen bestaande dienst aanpassen
            this.heleRooster[roosterIndex].Diensten[typeDienstID]

            const gewijzigdeDienst: HeliosDienst = {
                ID: roosterdag.Diensten[typeDienstID].ID,
                DATUM: roosterdag.DATUM,
                TYPE_DIENST_ID: typeDienstID,
                LID_ID: +lid_id!
            }
            this.dienstenService.updateDienst(gewijzigdeDienst).then(record => {
                this.heleRooster[roosterIndex].Diensten[typeDienstID] = record;
                this.heleRooster[roosterIndex].Diensten[typeDienstID].NAAM = naam;
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
        const roosterIndex = this.heleRooster.findIndex((dag => dag.DATUM == roosterdag.DATUM));

        if (roosterIndex < 0) {
            console.error("Datum " + roosterdag.DATUM + " onbekend");  // dat mag nooit voorkomen
            return false;
        }

        this.dienstenService.deleteDienst(roosterdag.Diensten[typeDienstID].ID!).then(() => delete this.heleRooster[roosterIndex].Diensten[typeDienstID]);

        // totalen aanpassen als het een clubdag is
        if (roosterdag.CLUB_BEDRIJF) {
            const ledenIndex = this.alleLeden.findIndex((lid => lid.ID == roosterdag.Diensten[typeDienstID].LID_ID));
            if (ledenIndex < 0) {
                console.error("Lid " + roosterdag.Diensten[typeDienstID].LID_ID + " onbekend");  // dat mag nooit voorkomen
            } else {
                this.alleLeden[ledenIndex].INGEDEELD_MAAND! -= 1;
                this.alleLeden[ledenIndex].INGEDEELD_JAAR! -= 1;
            }
        }
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

    // Open van het leden-filter dialoog
    filterPopup() {
        this.ledenFilter.openPopup();
    }

    // Er is een aanpassing gemaakt in het leden-filter dialoog. We filteren de volledige dataset tot wat nodig is
    // We hoeven dus niet terug naar de server om data opnieuw op te halen (minder data verkeer)
    applyLedenFilter() {
        let toonAlles: boolean = false;

        this.toonStartleiders = false;
        this.toonInstructeurs = false;
        this.toonLieristen = false;
        this.toonDDWV = false;

        // als er geen filters zijn, dan tonen we alles
        if (!this.sharedService.ledenlijstFilter.startleiders &&
            !this.sharedService.ledenlijstFilter.lieristen &&
            !this.sharedService.ledenlijstFilter.instructeurs &&
            !this.sharedService.ledenlijstFilter.crew) {
            toonAlles = true;
        }

        if (toonAlles) {
            this.toonStartleiders = true;
            this.toonInstructeurs = true;
            this.toonLieristen = true;
        } else {      // aha, er zijn wel filters gezet
            if (this.sharedService.ledenlijstFilter.startleiders) {
                this.toonStartleiders = true;
            }
            if (this.sharedService.ledenlijstFilter.instructeurs) {
                this.toonInstructeurs = true;
            }
            if (this.sharedService.ledenlijstFilter.lieristen) {
                this.toonLieristen = true;
            }
            if (this.sharedService.ledenlijstFilter.crew) {
                this.toonDDWV = true;
            }
        }

        // leden-filter de dataset naar de lijst
        let tmpLeden: HeliosLedenDatasetExtended[] = [];
        for (let i = 0; i < this.alleLeden.length; i++) {

            // 601 = Erelid
            // 602 = Lid
            // 603 = Jeugdlid
            let isLid = false;
            if ((this.alleLeden[i].LIDTYPE_ID == 601) ||
                (this.alleLeden[i].LIDTYPE_ID == 602) ||
                (this.alleLeden[i].LIDTYPE_ID == 603)) {
                isLid = true;
            }

            let tonen = false;
            if (isLid && toonAlles) {
                if (this.alleLeden[i].INSTRUCTEUR == true || this.alleLeden[i].STARTLEIDER == true || this.alleLeden[i].LIERIST == true) {
                    tonen = true;
                }
            } else if (this.sharedService.ledenlijstFilter.startleiders && this.alleLeden[i].STARTLEIDER == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.lieristen && this.alleLeden[i].LIERIST == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.instructeurs && this.alleLeden[i].INSTRUCTEUR == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.crew && this.alleLeden[i].DDWV_CREW == true) {
                tonen = true;
            }

            if (tonen) {
                // moeten we zoeken naar een lid ?
                if (this.zoekString && this.zoekString != "") {
                    const naamStr = this.alleLeden[i].NAAM?.toLowerCase();
                    if (!naamStr!.includes(this.zoekString.toLowerCase()))
                        continue;
                }
                tmpLeden.push(this.alleLeden[i]);
            }
        }
        this.filteredLeden = tmpLeden;
    }

    // Laat hele rooster zien, of alleen weekend / DDWV
    applyRoosterFilter() {
        // toonClubDDWV, 0 = laat alle dagen zien, dus club dagen en DDWV dagen
        if (this.toonClubDDWV == 0) {
            this.filteredRooster = this.heleRooster;
            return;
        }

        let tmpRooster: HeliosRoosterDagExtended[] = [];
        for (let i = 0; i < this.heleRooster.length; i++) {
            switch (this.toonClubDDWV) {
                case 1: // toonClubDDWV, 1 = toon clubdagen
                {
                    if (this.heleRooster[i].CLUB_BEDRIJF) {
                        tmpRooster.push(this.heleRooster[i]);
                        continue;
                    }
                    break;
                }
                case 2: // toonClubDDWV, 2 = toon DDWV
                    if (this.heleRooster[i].DDWV) {
                        tmpRooster.push(this.heleRooster[i]);
                        continue;
                    }
                    break;
            }
        }
        this.filteredRooster = tmpRooster
    }

    KolomBreedte() {
        if (this.toonDDWV) {
            return 'width: 50%'
        }

        let columns = 2;    // dag + opmerkingen
        if (this.toonInstructeurs) {
            columns += 2;
        }
        if (this.toonStartleiders) {
            columns++;
        }
        if (this.toonLieristen) {
            columns += 2;
        }
        const breedte = 100 / columns;
        return 'width:' + breedte + '%';
    }

    ToggleWeekendDDWV() {
        this.toonClubDDWV = ++this.toonClubDDWV % 3;
        this.applyRoosterFilter();
    }

    DagVanDeWeek(dag: string): string {
        const dt: DateTime = DateTime.fromSQL(dag as string);

        switch (dt.weekday) {
            case 1:
                return "Maandag";
            case 2:
                return "Dinsdag";
            case 3:
                return "Woensdag";
            case 4:
                return "Donderdag";
            case 5:
                return "Vrijdag";
            case 6:
                return "Zaterdag";
            case 7:
                return "Zondag";
        }
        return "??";
    }

    datumInToekomst(datum: string) {
        const nu: DateTime = DateTime.now();
        const d: DateTime = DateTime.fromSQL(datum);

        return (d > nu) // datum is in het verleden
    }

    zelfIndelen(dienstType: number, datum: string): boolean {
        if (!this.alleLeden || this.isDDWVer)    {
            return false; // Als leden nog niet geladen zijn, kunnen we onzelf ook niet indelen, DDWVs mogen nooit ingedeeld worden
        }

        const nu: DateTime = DateTime.now();
        const d: DateTime = DateTime.fromSQL(datum);

        if (!this.datumInToekomst(datum)) {
            return false;   // datum is in het verleden
        }

        const lid = this.alleLeden.find((l) => (l.ID?.toString() == this.mijnID));

        if (!lid) {
            return false;    // Dit mag nooit voorkomen
        }

        // je mag jezelf maar beperkt indelen, geldt niet voor roostermakers en beheerders
        if (!this.magWijzigen && (lid.INGEDEELD_MAAND! >= this.MaxDienstenPerMaand)) {
            return false;
        }

        if (this.configService.getZelfIndelen()) {
            const indeelbareDienst = this.configService.getZelfIndelen().find((d: any) => (d.TypeDienst == dienstType));

            // Dienst is bekend in config, return of je jezelf mag Indelen
            if (indeelbareDienst) {
                return indeelbareDienst.ZelfIndelen;
            }
        }

        return true;
    }

    magVerwijderen(dienstData: HeliosDienstenDataset): boolean {
        if (!dienstData || this.isDDWVer) {
            return false;       // er is niets te verwijderen, DDWV'ers mogen geen aanpassingen maken
        }

        const datum: DateTime = DateTime.fromSQL(dienstData.DATUM as string);
        const nu: DateTime = DateTime.now();
        const la: DateTime = DateTime.fromSQL(dienstData.LAATSTE_AANPASSING as string);

        if (this.magWijzigen) {
            return true;    // roostermakers en beheerders mogen altijd aanpassingen maken
        }

        if (datum < nu) {
            return false;   // datum is in het verleden
        }

        const ui = this.loginService.userInfo?.LidData;
        if (dienstData.LID_ID != ui?.ID) {
            return false;   // mogen natuurlijk geen aanpassing maken op diensten van iemand anders
        }

        if (this.configService.getZelfIndelen()) {
            const indeelbareDienst = this.configService.getZelfIndelen().find((d: any) => (d.TypeDienst == dienstData.TYPE_DIENST_ID));
            // Dienst is bekend in config, return of je jezelf mag Indelen
            if (indeelbareDienst) {
                if (!indeelbareDienst.ZelfIndelen)
                    return false;
            }
        }

        if (nu.diff(datum, "months").months < -2) {
            return true;    // tot 2 maanden mag je vrij aanpassen
        }

        return nu.diff(la, "hours").hours < 4;

    }

    // laat zien hoe vaak een lid is ingedeeld voor het gekozen jaar
    toonJaarRooster(): void {
        this.jaarTotalen.openPopup();
    }

    // sorteer zodanig dat lid met minste diensten bovenaan staat
    sorteer() {
        this.filteredLeden.sort((a, b) => {
            if (a.INGEDEELD_JAAR == b.INGEDEELD_JAAR) {
                if (a.INGEDEELD_MAAND == b.INGEDEELD_MAAND) {
                    return a.NAAM!.localeCompare(b.NAAM!);
                }
                return (a.INGEDEELD_MAAND! > b.INGEDEELD_MAAND!) ? 1 : -1;
            }
            return (a.INGEDEELD_JAAR! > b.INGEDEELD_JAAR!) ? 1 : -1;
        })
    }

    // Export naar excel in pivot view
    exportRooster() {
        let exportData: any = [];
        let legeDiensten: any = {};

        this.dienstTypes.forEach(dienst => legeDiensten[dienst.OMSCHRIJVING!] = "");

        this.filteredRooster.forEach(dag => {
            const d = DateTime.fromSQL(dag.DATUM!);

            let record: any = Object.assign({
                DATUM: d.day + "-" + d.month + "-" + d.year,    // Datum in juiste formaat zetten
                DDWV: dag.DDWV ? "X" : "-",
                CLUB_BEDRIJF: dag.CLUB_BEDRIJF ? "X" : "-",
                OPMERKINGEN: dag.OPMERKINGEN
            }, legeDiensten);

            dag.Diensten.forEach(dienst => {
                if (dienst) {
                    record[dienst.TYPE_DIENST!] = dienst.NAAM;
                }
            });
            exportData.push(record)
        });

        let ws = xlsx.utils.json_to_sheet(exportData);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'rooster ' + this.datum.year + '-' + this.datum.month + ' ' + new Date().toJSON().slice(0, 10) + '.xlsx');
    }


    mijnDienstClass(dienst: HeliosDienstenDataset): string {
        if (dienst) {
            const ui = this.loginService.userInfo?.LidData;
            if (dienst.LID_ID == ui?.ID) {
                return "mijnDienst"
            }
        }
        return ""
    }
}
