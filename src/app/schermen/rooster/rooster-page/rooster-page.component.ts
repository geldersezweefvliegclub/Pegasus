import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {LedenService} from '../../../services/apiservice/leden.service';
import {
    HeliosDienst,
    HeliosDienstenDataset,
    HeliosLedenDataset, HeliosLidData,
    HeliosRoosterDag,
    HeliosRoosterDataset,
    HeliosType, HeliosUserinfo
} from '../../../types/Helios';
import {faCalendarDay} from '@fortawesome/free-solid-svg-icons';
import {SchermGrootte, SharedService} from '../../../services/shared/shared.service';
import {Subscription} from 'rxjs';
import {RoosterService} from '../../../services/apiservice/rooster.service';
import {DateTime} from 'luxon';
import {LedenFilterComponent} from "../../../shared/components/leden-filter/leden-filter.component";
import {LoginService} from "../../../services/apiservice/login.service";
import {DienstenService} from "../../../services/apiservice/diensten.service";
import * as xlsx from "xlsx";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {TypesService} from "../../../services/apiservice/types.service";
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {getBeginEindDatumVanMaand} from "../../../utils/Utils";
import {HeliosActie, KeyValueArray} from "../../../types/Utils";
import {DdwvService} from "../../../services/apiservice/ddwv.service";

export type HeliosLedenDatasetExtended = HeliosLedenDataset & {
    INGEDEELD_MAAND?: number
    INGEDEELD_JAAR?: number
}

export type HeliosRoosterDagExtended = HeliosRoosterDag & {
    Diensten: HeliosDienstenDataset[];
}

export type WeergaveData = {
    Startleiders: boolean;
    Instructeurs: boolean;
    Lieristen: boolean;
    LIO: boolean;
    Sleepvliegers: boolean;
    GastenVliegers: boolean;
    DDWV: boolean;

    toonTotalen: boolean;
    toonClubDDWV: number;            // 0, gehele week, 1 = club dagen, 2 = alleen DDWV

    toonDienst: KeyValueArray;
}

@Component({
    selector: 'app-rooster-page',
    templateUrl: './rooster-page.component.html',
    styleUrls: ['./rooster-page.component.scss']
})
export class RoosterPageComponent implements OnInit, OnDestroy {
    @ViewChild(LedenFilterComponent) ledenFilter: LedenFilterComponent;

    readonly roosterIcon: IconDefinition = faCalendarDay;

    roosterView: string = "maand";       // toon rooster voor maand, week of dag

    private typesAbonnement: Subscription;
    dienstTypes: HeliosType[] = [];

    private ledenAbonnement: Subscription;
    alleLeden: HeliosLedenDatasetExtended[];

    filteredLeden: HeliosLedenDatasetExtended[];
    diensten: HeliosDienstenDataset[];

    rooster: HeliosRoosterDataset[];                // rooster voor gekozen periode (dag/week/maand)
    heleRooster: HeliosRoosterDagExtended[];        // combinatie rooster & diensten
    filteredRooster: HeliosRoosterDagExtended[];    // combinatie rooster & diensten, welke getoond worden

    private dbEventAbonnement: Subscription;        // Er is iets in de database aangepast
    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    datum: DateTime = DateTime.now();               // de gekozen dag
    maandag: DateTime                               // de eerste dag van de week
    ddwvActief: boolean = true;

    private tonen: WeergaveData = {                    // Welke diensten worden wel/niet getoond
        Startleiders: true,
        Instructeurs: true,
        Lieristen: true,
        LIO: true,
        Sleepvliegers: true,
        GastenVliegers: true,
        DDWV: true,

        toonTotalen: true,
        toonClubDDWV: 1,                            // 0, gehele week, 1 = club dagen, 2 = alleen DDWV

        toonDienst: {}
    };
    magExporteren: boolean = true;

    userInfo: HeliosUserinfo;
    isDDWVer: boolean;
    magWijzigen: boolean = false;

    isLoading: number = 0;
    zoekString: string;

    constructor(private readonly ddwvService: DdwvService,
                private readonly loginService: LoginService,
                private readonly ledenService: LedenService,
                private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly configService: PegasusConfigService,
                private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService) {
    }

    ngOnInit(): void {
        this.onWindowResize();          // bepaal wat we moeten tonen dag/week/maand

        const ui = this.loginService.userInfo;
        this.magWijzigen = (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isBeheerderDDWV || ui?.Userinfo?.isRooster) ? true : false;
        this.isDDWVer = this.loginService.userInfo?.Userinfo?.isDDWV!;

        this.magExporteren = !ui?.Userinfo?.isDDWV;

        if (this.isDDWVer) {
            this.tonen.toonClubDDWV = 2;   // Alleen DDWV
        }

        // via configuratie kunnen diensten aan/uit gezet worden
        this.tonen.toonDienst[this.configService.OCHTEND_DDI_TYPE_ID] = this.toonDienst(this.configService.OCHTEND_DDI_TYPE_ID);
        this.tonen.toonDienst[this.configService.MIDDAG_DDI_TYPE_ID] = this.toonDienst(this.configService.MIDDAG_DDI_TYPE_ID);
        this.tonen.toonDienst[this.configService.OCHTEND_INSTRUCTEUR_TYPE_ID] = this.toonDienst(this.configService.OCHTEND_INSTRUCTEUR_TYPE_ID);
        this.tonen.toonDienst[this.configService.MIDDAG_INSTRUCTEUR_TYPE_ID] = this.toonDienst(this.configService.MIDDAG_INSTRUCTEUR_TYPE_ID);
        this.tonen.toonDienst[this.configService.OCHTEND_STARTLEIDER_TYPE_ID] = this.toonDienst(this.configService.OCHTEND_STARTLEIDER_TYPE_ID);
        this.tonen.toonDienst[this.configService.MIDDAG_STARTLEIDER_TYPE_ID] = this.toonDienst(this.configService.MIDDAG_STARTLEIDER_TYPE_ID);
        this.tonen.toonDienst[this.configService.OCHTEND_STARTLEIDER_IO_TYPE_ID] = this.toonDienst(this.configService.OCHTEND_STARTLEIDER_IO_TYPE_ID);
        this.tonen.toonDienst[this.configService.MIDDAG_STARTLEIDER_IO_TYPE_ID] = this.toonDienst(this.configService.MIDDAG_STARTLEIDER_IO_TYPE_ID);

        this.tonen.toonDienst[this.configService.OCHTEND_LIERIST_TYPE_ID] = this.toonDienst(this.configService.OCHTEND_LIERIST_TYPE_ID);
        this.tonen.toonDienst[this.configService.MIDDAG_LIERIST_TYPE_ID] = this.toonDienst(this.configService.MIDDAG_LIERIST_TYPE_ID);
        this.tonen.toonDienst[this.configService.OCHTEND_HULPLIERIST_TYPE_ID] = this.toonDienst(this.configService.OCHTEND_HULPLIERIST_TYPE_ID);
        this.tonen.toonDienst[this.configService.MIDDAG_HULPLIERIST_TYPE_ID] = this.toonDienst(this.configService.MIDDAG_HULPLIERIST_TYPE_ID);
        this.tonen.toonDienst[this.configService.SLEEPVLIEGER_TYPE_ID] = this.toonDienst(this.configService.SLEEPVLIEGER_TYPE_ID);
        this.tonen.toonDienst[this.configService.GASTEN_VLIEGER1_TYPE_ID] = this.toonDienst(this.configService.GASTEN_VLIEGER1_TYPE_ID);
        this.tonen.toonDienst[this.configService.GASTEN_VLIEGER2_TYPE_ID] = this.toonDienst(this.configService.GASTEN_VLIEGER2_TYPE_ID);

        this.tonen.toonTotalen = (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isCIMT || ui?.Userinfo?.isRooster) ? true : false;

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1
                })
                this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
                this.opvragen();
                this.opvragenTotalen();
            }
        })

        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            const opvragenTotalen = datum.month != this.datum.month;

            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day,
            })
            this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
            this.opvragen();
            if (opvragenTotalen) {
                this.opvragenTotalen();
            }
        });

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.dienstTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 18
            });    // type diensten
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

        // Als in de progressie tabel is aangepast, moet we onze dataset ook aanpassen
        this.dbEventAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if ((ev.tabel == "Diensten") || (ev.tabel == "DDWV")) {
                this.opvragen();
            }
        });

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize();
            this.opvragen();
        });

        this.ddwvActief = this.ddwvService.actief();
    }

    ngOnDestroy(): void {
        if (this.ledenAbonnement) this.ledenAbonnement.unsubscribe();
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
        if (this.dbEventAbonnement) this.dbEventAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    onWindowResize() {
        if (this.sharedService.getSchermSize() <= SchermGrootte.sm) {
            this.roosterView = "dag"
        } else if (this.sharedService.getSchermSize() >= SchermGrootte.xl) {
            this.roosterView = "maand"
        } else {
            this.roosterView = "week"
        }
    }

    private opvragen(): void {
        const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

        let beginDatum: DateTime = beginEindDatum.begindatum;
        let eindDatum: DateTime = beginEindDatum.einddatum;

        switch (this.roosterView) {
            case "dag" : {
                beginDatum = this.datum;
                eindDatum = this.datum;
                break;
            }
            case "week": {
                beginDatum = this.datum.startOf('week');     // maandag in de 1e week vande maand, kan in de vorige maand vallen
                eindDatum = this.datum.endOf('week');        // zondag van de laaste week, kan in de volgende maand vallen
                break;
            }
        }
        this.roosterService.getRooster(beginDatum, eindDatum).then((rooster) => {
            this.rooster = rooster;
            this.diensten = [];

            this.dienstenService.getDiensten(beginDatum, eindDatum).then((diensten) => {
                this.diensten = diensten;
                this.extendRooster();
                this.applyRoosterFilter();
            })
        })
    }

    private opvragenTotalen() {
        if (!this.tonen.toonTotalen) {
            this.maandTotaalUser()      // opvragen totalen voor de ingelogde gebruiker
        } else {
            // opvragen totalen voor alle leden
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

    // Voeg de diensten toe aan het rooster en noem het resultaat heleRooster.
    private extendRooster() {
        const exRooster: HeliosRoosterDagExtended[] = (this.rooster as HeliosRoosterDagExtended[]);

        exRooster.forEach(dag => {
            dag.Diensten = [];              // placeholder, gaan het vullen waar nodig

            if (this.diensten) {
                const diensten: HeliosDienstenDataset[] = this.diensten.filter((dienst) => dienst.DATUM == dag.DATUM)
                diensten.forEach((dienst) => dag.Diensten[dienst.TYPE_DIENST_ID!] = dienst)
            }
        });

        this.heleRooster = JSON.parse(JSON.stringify(exRooster));
        this.applyRoosterFilter();
    }


    // Open van het leden-filter dialoog
    filterPopup() {
        this.ledenFilter.openPopup();
    }

    // moeten we de dienst tonen, niet iedere club heeft dezelfde diensten
    // Via config bestand kun je aangeven of dienst getoond moet worden
    public toonDienst(dienstType: number): boolean {
        const indeelbareDienst = this.configService.getDienstConfig().find((d: any) => (d.TypeDienst == dienstType));

        if (indeelbareDienst) {
            if (indeelbareDienst.Tonen) return true;
        }
        return false;
    }

    // Er is een aanpassing gemaakt in het leden-filter dialoog. We filteren de volledige dataset tot wat nodig is
    // We hoeven dus niet terug naar de server om starts opnieuw op te halen (minder starts verkeer)
    applyLedenFilter() {
        let toonAlles: boolean = false;

        this.tonen.Startleiders = false;
        this.tonen.Instructeurs = false;
        this.tonen.Lieristen = false;
        this.tonen.LIO = false;
        this.tonen.Sleepvliegers = false;
        this.tonen.GastenVliegers = false;
        this.tonen.DDWV = false;

        // als er geen filters zijn, dan tonen we alles
        if (!this.sharedService.ledenlijstFilter.startleiders &&
            !this.sharedService.ledenlijstFilter.lieristen &&
            !this.sharedService.ledenlijstFilter.lio &&
            !this.sharedService.ledenlijstFilter.instructeurs &&
            !this.sharedService.ledenlijstFilter.sleepvliegers &&
            !this.sharedService.ledenlijstFilter.gastenVliegers &&
            !this.sharedService.ledenlijstFilter.crew) {
            toonAlles = true;
        }

        if (toonAlles) {
            this.tonen.Startleiders = true;
            this.tonen.Instructeurs = true;
            this.tonen.Lieristen = true;
            this.tonen.LIO = true;
            this.tonen.Sleepvliegers = true;
            this.tonen.GastenVliegers = true;
        } else {      // aha, er zijn wel filters gezet
            if (this.sharedService.ledenlijstFilter.startleiders) {
                this.tonen.Startleiders = true;
            }
            if (this.sharedService.ledenlijstFilter.instructeurs) {
                this.tonen.Instructeurs = true;
            }
            if (this.sharedService.ledenlijstFilter.lieristen) {
                this.tonen.Lieristen = true;
            }
            if (this.sharedService.ledenlijstFilter.lio) {
                this.tonen.LIO = true;
            }
            if (this.sharedService.ledenlijstFilter.sleepvliegers) {
                this.tonen.Sleepvliegers = true;
            }
            if (this.sharedService.ledenlijstFilter.gastenVliegers) {
                this.tonen.GastenVliegers = true;
            }
            if (this.sharedService.ledenlijstFilter.crew) {
                this.tonen.DDWV = true;
            }
        }

        // leden-filter de dataset naar de lijst
        let tmpLeden: HeliosLedenDatasetExtended[] = [];
        for (let i = 0; i < this.alleLeden.length; i++) {

            // 601 = Erelid
            // 602 = Lid
            // 603 = Jeugdlid
            // 604 = private owner
            // 605 = veteraan
            let isLid = false;
            if ((this.alleLeden[i].LIDTYPE_ID == 601) ||
                (this.alleLeden[i].LIDTYPE_ID == 602) ||
                (this.alleLeden[i].LIDTYPE_ID == 603) ||
                (this.alleLeden[i].LIDTYPE_ID == 604) ||
                (this.alleLeden[i].LIDTYPE_ID == 605)) {
                isLid = true;
            }

            let tonen = false;
            if (isLid && toonAlles) {
                if (this.alleLeden[i].INSTRUCTEUR == true || this.alleLeden[i].STARTLEIDER == true || this.alleLeden[i].LIERIST == true || this.alleLeden[i].LIERIST_IO == true) {
                    tonen = true;
                }
            } else if (this.sharedService.ledenlijstFilter.startleiders && this.alleLeden[i].STARTLEIDER == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.lieristen && this.alleLeden[i].LIERIST == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.lio && this.alleLeden[i].LIERIST_IO == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.instructeurs && this.alleLeden[i].INSTRUCTEUR == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.crew && this.alleLeden[i].DDWV_CREW == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.sleepvliegers && this.alleLeden[i].SLEEPVLIEGER == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.gastenVliegers && this.alleLeden[i].GASTENVLIEGER == true) {
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
        if (this.tonen.toonClubDDWV == 0) {
            this.filteredRooster = this.heleRooster;
            return;
        }

        let tmpRooster: HeliosRoosterDagExtended[] = [];
        for (let i = 0; i < this.heleRooster.length; i++) {
            switch (this.tonen.toonClubDDWV) {
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
        this.filteredRooster = [];
        if (tmpRooster.length > 0) {
            this.filteredRooster = tmpRooster;
        } else {
            this.filteredRooster = this.heleRooster;
        }
    }

    /**
     * Bepaal aantal diensten van deze maand voor de ingelogde gebruiker. Totalen API wordt niet gebruikt voor normale gebruikers,
     * maar alleen voor roostermakers, beheerders. Totaal voor de maand is belangrijk om zelf te kunnen indelen
     * Je mag hezelf maar beperkt indelen
     * @private
     */
    private maandTotaalUser() {
        const ui = this.loginService.userInfo;

        if (this.alleLeden) {
            const lid = this.alleLeden.find((l) => (l.ID?.toString() == ui!.LidData!.ID));

            if (lid) {
                const lidDiensten = this.diensten.filter((dienst) => dienst.LID_ID!.toString() == ui!.LidData!.ID!.toString());
                lid.INGEDEELD_MAAND = lidDiensten.length;
            }
        }
    }

    WeekKolomBreedte(kolommen: number): string {
        const breedte = 100 / kolommen;
        return 'width: calc(' + breedte + '% - 40px)';
    }

    // welke dagen willen we laten zien, DDWV'ers kunnen alleen DDWV dagen zien
    ToggleWeekendDDWV() {
        if (this.ddwvActief) {
            this.tonen.toonClubDDWV = ++this.tonen.toonClubDDWV % 3;
        }
        else {
            this.tonen.toonClubDDWV = ++this.tonen.toonClubDDWV % 2;    // DDWV is niet actief, dus niet tonen
        }
        this.applyRoosterFilter();
    }

    zelfIndelen = (dienstType: number, datum: string): boolean => {
        if (!this.alleLeden || this.isDDWVer) {
            return false; // Als leden nog niet geladen zijn, kunnen we onzelf ook niet indelen, DDWVs mogen nooit ingedeeld worden
        }

        const nu: DateTime = DateTime.now();
        const d: DateTime = DateTime.fromSQL(datum);

        if (!this.sharedService.datumInToekomst(datum)) {
            return false;   // datum is in het verleden
        }

        const ui = this.loginService.userInfo;
        const lid = this.alleLeden.find((l) => (l.ID! == ui!.LidData!.ID!));
        const rooster = this.heleRooster.find((r) => (r.DATUM == datum));

        if (!lid) {
            return false;    // Dit mag nooit voorkomen
        }

        if (!rooster) {
            return false;    // Dit mag nooit voorkomen
        }

        // Als er geen vliegdag is, is er ook niets in te delen
        if (!rooster.DDWV && !rooster.CLUB_BEDRIJF) {
            return false;
        }

        // op DDWV dagen mag de DDWV crew zichzelf indelen
        if (this.ddwvService.actief()) {
            if (rooster.DDWV && !rooster.CLUB_BEDRIJF) {
                return lid.DDWV_CREW!;
            }
        }

        switch (dienstType) {
            case this.configService.OCHTEND_DDI_TYPE_ID:
            case this.configService.MIDDAG_DDI_TYPE_ID:
            case this.configService.OCHTEND_INSTRUCTEUR_TYPE_ID:
            case this.configService.MIDDAG_INSTRUCTEUR_TYPE_ID:
            {
                if (ui!.LidData!.INSTRUCTEUR == false) {
                    return false;
                }
                break;
            }
            case this.configService.OCHTEND_STARTLEIDER_TYPE_ID:
            case this.configService.MIDDAG_STARTLEIDER_TYPE_ID:
            case this.configService.OCHTEND_STARTLEIDER_IO_TYPE_ID:
            case this.configService.MIDDAG_STARTLEIDER_IO_TYPE_ID:
            {
                if (ui!.LidData!.STARTLEIDER == false) {
                    return false;
                }
                break;
            }
            case this.configService.OCHTEND_LIERIST_TYPE_ID:
            case this.configService.MIDDAG_LIERIST_TYPE_ID:
            {
                if (ui!.LidData!.LIERIST == false) {
                    return false;
                }
                break;
            }
            case this.configService.OCHTEND_HULPLIERIST_TYPE_ID:
            case this.configService.MIDDAG_HULPLIERIST_TYPE_ID:
            {
                if (ui!.LidData!.LIERIST_IO == false) {
                    return false;
                }
                break;
            }
            case this.configService.GASTEN_VLIEGER1_TYPE_ID:
            case this.configService.GASTEN_VLIEGER2_TYPE_ID:
            {
                if (ui!.LidData!.GASTENVLIEGER == false) {
                    return false;
                }
                break;
            }
            case this.configService.SLEEPVLIEGER_TYPE_ID:
            {
                if (ui!.LidData!.SLEEPVLIEGER == false) {
                    return false;
                }
                break;
            }
            default :
            {
                return false;
            }
        }

        // je mag jezelf maar beperkt indelen, geldt niet voor roostermakers en beheerders
        if (!this.magWijzigen && (lid.INGEDEELD_MAAND! >= this.configService.maxZelfDienstenIndelen())) {
            return false;
        }

        if (this.configService.getDienstConfig()) {
            const indeelbareDienst = this.configService.getDienstConfig().find((d: any) => (d.TypeDienst == dienstType));

            // Dienst is bekend in config, return of je jezelf mag Indelen
            if (indeelbareDienst) {
                return indeelbareDienst.ZelfIndelen;
            }
        }

        return true;
    }

    magVerwijderen = (dienstData: HeliosDienstenDataset): boolean => {
        if (!dienstData || this.isDDWVer) {
            return false;       // er is niets te verwijderen, DDWV'ers mogen geen aanpassingen maken
        }

        const datum: DateTime = DateTime.fromSQL(dienstData.DATUM as string);
        const nu: DateTime = DateTime.now();
        const la: DateTime = DateTime.fromSQL(dienstData.LAATSTE_AANPASSING as string);

        if (dienstData.UITBETAALD) {    // Als er uitbetaald is, dan geen wijzigingen meer maken
            return false;
        }

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

        if (this.configService.getDienstConfig()) {
            const indeelbareDienst = this.configService.getDienstConfig().find((d: any) => (d.TypeDienst == dienstData.TYPE_DIENST_ID));
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

    lidInRoosterClass = (dienst: HeliosDienstenDataset): string => {
        let classes = ""
        if (this.magWijzigen && this.tonen.Sleepvliegers && this.tonen.Startleiders && this.tonen.Lieristen && this.tonen.Instructeurs) {
            classes += "lidInRooster ";
        }

        if (dienst) {
            const ui = this.loginService.userInfo?.LidData;
            if (dienst.LID_ID == ui?.ID) {
                classes += "mijnDienst"
            }

            if (dienst.UITBETAALD) {
                classes += "uitbetaald"
            }
        }

        return classes;
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

    zetDatum(nieuweDatum: DateTime) {
        this.datum = nieuweDatum;
        this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
        this.opvragen();
    }

}
