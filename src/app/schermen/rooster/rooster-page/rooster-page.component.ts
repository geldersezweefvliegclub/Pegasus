import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { LedenService } from '../../../services/apiservice/leden.service';
import {
  HeliosDienstenDataset,
  HeliosLedenDataset,
  HeliosRoosterDag,
  HeliosRoosterDataset,
  HeliosType,
  HeliosUserinfo,
} from '../../../types/Helios';
import { faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { SchermGrootte, SharedService } from '../../../services/shared/shared.service';
import { Subscription } from 'rxjs';
import { RoosterService } from '../../../services/apiservice/rooster.service';
import { DateTime } from 'luxon';
import { LedenFilterComponent } from '../../../shared/components/leden-filter/leden-filter.component';
import { LoginService } from '../../../services/apiservice/login.service';
import { DienstenService } from '../../../services/apiservice/diensten.service';
import * as xlsx from 'xlsx';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { TypesService } from '../../../services/apiservice/types.service';
import { PegasusConfigService } from '../../../services/shared/pegasus-config.service';
import { getBeginEindDatumVanMaand } from '../../../utils/Utils';
import { KeyValueArray } from '../../../types/Utils';
import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { RoosterMaandviewComponent } from '../rooster-maandview/rooster-maandview.component';
import { RoosterWeekviewComponent } from '../rooster-weekview/rooster-weekview.component';
import { RoosterDagviewComponent } from '../rooster-dagview/rooster-dagview.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { ZoekbarComponent } from '../../../shared/components/zoekbar/zoekbar.component';

export type HeliosLedenDatasetExtended = HeliosLedenDataset & {
    INGEDEELD_MAAND?: number
    INGEDEELD_JAAR?: number
}

export type HeliosRoosterDagExtended = HeliosRoosterDag & {
    Diensten: HeliosDienstenDataset[];
}

export interface WeergaveData {
    Startleiders: boolean;
    Instructeurs: boolean;
    Lieristen: boolean;
    LIO: boolean;
    Sleepvliegers: boolean;
    DDWV: boolean;

    toonTotalen: boolean;
    toonClubDDWV: number;            // 0, gehele week, 1 = club dagen, 2 = alleen DDWV

    toonDienst: KeyValueArray;
}

@Component({
    selector: 'app-rooster-page',
    host: { class: 'scherm-pagina' },
    templateUrl: './rooster-page.component.html',
    styleUrls: ['./rooster-page.component.scss'],
    imports: [PegasusCardComponent, CdkDropListGroup, RoosterMaandviewComponent, RoosterWeekviewComponent, RoosterDagviewComponent, IconButtonComponent, ZoekbarComponent, LedenFilterComponent]
})
export class RoosterPageComponent implements OnInit, OnDestroy {
    userInfo: HeliosUserinfo;

    // variablen in html formulier
    protected readonly roosterIcon: IconDefinition = faCalendarDay;

    protected roosterView = "maand";       // toon rooster voor maand, week of dag
    protected filteredLeden: HeliosLedenDatasetExtended[];
    protected rooster: HeliosRoosterDataset[];                // rooster voor gekozen periode (dag/week/maand)
    protected filteredRooster: HeliosRoosterDagExtended[];    // combinatie rooster & diensten, welke getoond worden
    protected datum: DateTime = DateTime.now();               // de gekozen dag
    protected tonen: WeergaveData = {                 // Welke diensten worden wel/niet getoond
        Startleiders: true,
        Instructeurs: true,
        Lieristen: true,
        LIO: true,
        Sleepvliegers: true,
        DDWV: true,

        toonTotalen: true,
        toonClubDDWV: 1,                            // 0, gehele week, 1 = club dagen, 2 = alleen DDWV

        toonDienst: {}
    };
    protected magExporteren = true;
    protected isDDWVer: boolean;
    protected magWijzigen = false;
    protected isLoading = 0;
    protected zoekString: string;
    protected zelfIndelen = (dienstType: number, datum: string): boolean => {
        if (!this.alleLeden || this.isDDWVer) {
            return false; // Als leden nog niet geladen zijn, kunnen we onzelf ook niet indelen, DDWVs mogen nooit ingedeeld worden
        }

        if (!this.sharedService.datumInToekomst(datum)) {
            return false;   // datum is in het verleden
        }

        const ui = this.loginService.userInfo;
        const rooster = this.heleRooster.find((r) => (r.DATUM == datum));

        if (!rooster) {
            return false;    // Dit mag nooit voorkomen
        }

        // Als er geen vliegdag is, is er ook niets in te delen
        if (!rooster.DDWV && !rooster.CLUB_BEDRIJF) {
            return false;
        }

        // op DDWV dagen mag de DDWV crew zichzelf indelen
        // Sleep vlieger mogen zichzelf ook op DDWV dagen indelen, ze zijn geen DDWWV crew
        if (rooster.DDWV && !rooster.CLUB_BEDRIJF && dienstType != this.configService.SLEEPVLIEGER_TYPE_ID) {
            return ui!.Userinfo!.isDDWVCrew!;
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
        if (!this.magWijzigen && (this.ingedeeldMaand! >= this.configService.maxZelfDienstenIndelen())) {
            return false;
        }

        if (this.configService.getDienstConfig()) {
            const indeelbareDienst = this.configService.getDienstConfig().find((d) => (d.TypeDienst == dienstType));

            // Dienst is bekend in config, return of je jezelf mag Indelen
            if (indeelbareDienst) {
                return indeelbareDienst.ZelfIndelen;
            }
        }

        return true;
    }
    protected magVerwijderen = (dienstData: HeliosDienstenDataset): boolean => {
        if (!dienstData || this.isDDWVer) {
            return false;       // er is niets te verwijderen, DDWV'ers mogen geen aanpassingen maken
        }

        const datum: DateTime = DateTime.fromSQL(dienstData.DATUM as string);
        const nu: DateTime = DateTime.now();
        const la: DateTime = this.sharedService.parseDatum(dienstData.LAATSTE_AANPASSING as string);

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
            const indeelbareDienst = this.configService.getDienstConfig().find((d) => (d.TypeDienst == dienstData.TYPE_DIENST_ID));
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
    protected lidInRoosterClass = (dienst: HeliosDienstenDataset): string => {
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

    // private variable voor ts script
    private readonly loginService = inject(LoginService);
    private readonly ledenService = inject(LedenService);
    private readonly typesService = inject(TypesService);
    private readonly sharedService = inject(SharedService);
    private readonly configService = inject(PegasusConfigService);
    private readonly roosterService = inject(RoosterService);
    private readonly dienstenService = inject(DienstenService);
    private readonly ledenFilter = viewChild.required(LedenFilterComponent);

    private ingedeeldMaand = 0   // hoeveel is het ingelogde lid al ingedeeld in deze maand
    private typesAbonnement: Subscription;
    private dienstTypes: HeliosType[] = [];
    private ledenAbonnement: Subscription;
    private alleLeden: HeliosLedenDatasetExtended[];
    private diensten: HeliosDienstenDataset[];
    private heleRooster: HeliosRoosterDagExtended[];        // combinatie rooster & diensten
    private dbEventAbonnement: Subscription;        // Er is iets in de database aangepast
    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender

    ngOnInit(): void {
        this.onWindowResize();          // bepaal wat we moeten tonen dag/week/maand

        const ui = this.loginService.userInfo;
        this.magWijzigen = (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isBeheerderDDWV || ui?.Userinfo?.isRooster) ? true : false;
        this.isDDWVer = this.loginService.userInfo?.Userinfo?.isDDWV ?? false;

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

        this.tonen.toonTotalen = (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isCIMT || ui?.Userinfo?.isRooster) ? true : false;

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1
                })
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
            for (const item of this.alleLeden) {
                item.INGEDEELD_MAAND = 0;
                item.INGEDEELD_JAAR = 0;
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
        this.resizeSubscription = this.sharedService.onResize$.subscribe(() => {
            this.onWindowResize();
            this.opvragen();
        });

    }

    ngOnDestroy(): void {
        if (this.ledenAbonnement) this.ledenAbonnement.unsubscribe();
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
        if (this.dbEventAbonnement) this.dbEventAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    private onWindowResize() {
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
                this.maandTotaalUser()      // opvragen totalen voor de ingelogde gebruiker
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
    protected filterPopup() {
        this.ledenFilter().openPopup();
    }

    // moeten we de dienst tonen, niet iedere club heeft dezelfde diensten
    // Via config bestand kun je aangeven of dienst getoond moet worden
    public toonDienst(dienstType: number): boolean {
        const indeelbareDienst = this.configService.getDienstConfig().find((d) => (d.TypeDienst == dienstType));

        if (indeelbareDienst) {
            if (indeelbareDienst.Tonen) return true;
        }
        return false;
    }

    // Er is een aanpassing gemaakt in het leden-filter dialoog. We filteren de volledige dataset tot wat nodig is
    // We hoeven dus niet terug naar de server om starts opnieuw op te halen (minder starts verkeer)
    protected applyLedenFilter() {
        let toonAlles = false;

        this.tonen.Startleiders = false;
        this.tonen.Instructeurs = false;
        this.tonen.Lieristen = false;
        this.tonen.LIO = false;
        this.tonen.Sleepvliegers = false;
        this.tonen.DDWV = false;

        // als er geen filters zijn, dan tonen we alles
        if (!this.sharedService.ledenlijstFilter.startleiders &&
            !this.sharedService.ledenlijstFilter.lieristen &&
            !this.sharedService.ledenlijstFilter.lio &&
            !this.sharedService.ledenlijstFilter.instructeurs &&
            !this.sharedService.ledenlijstFilter.sleepvliegers &&
            !this.sharedService.ledenlijstFilter.crew) {
            toonAlles = true;
        }

        if (toonAlles) {
            this.tonen.Startleiders = true;
            this.tonen.Instructeurs = true;
            this.tonen.Lieristen = true;
            this.tonen.LIO = true;
            this.tonen.Sleepvliegers = true;
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
            if (this.sharedService.ledenlijstFilter.crew) {
                this.tonen.DDWV = true;
            }
        }

        // leden-filter de dataset naar de lijst
        const tmpLeden: HeliosLedenDatasetExtended[] = [];
        for (const item of this.alleLeden) {
            let tonen = false;
            if (toonAlles) {
                if (item.INSTRUCTEUR == true ||
                    item.STARTLEIDER == true ||
                    item.LIERIST == true ||
                    item.LIERIST_IO == true  ||
                    item.SLEEPVLIEGER == true)
                {
                    tonen = true;
                }
            } else if (this.sharedService.ledenlijstFilter.startleiders && item.STARTLEIDER == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.lieristen && item.LIERIST == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.lio && item.LIERIST_IO == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.instructeurs && item.INSTRUCTEUR == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.crew && item.DDWV_CREW == true) {
                tonen = true;
            } else if (this.sharedService.ledenlijstFilter.sleepvliegers && item.SLEEPVLIEGER == true) {
                tonen = true;
            }

            if (tonen) {
                // moeten we zoeken naar een lid ?
                if (this.zoekString && this.zoekString != "") {
                    const naamStr = item.NAAM?.toLowerCase();
                    if (!naamStr!.includes(this.zoekString.toLowerCase()))
                        continue;
                }
                tmpLeden.push(item);
            }
        }
        this.filteredLeden = tmpLeden;
    }

    // Laat hele rooster zien, of alleen weekend / DDWV
    private applyRoosterFilter() {
        // toonClubDDWV, 0 = laat alle dagen zien, dus club dagen en DDWV dagen
        if (this.tonen.toonClubDDWV == 0) {
            this.filteredRooster = this.heleRooster;
            return;
        }

        const tmpRooster: HeliosRoosterDagExtended[] = [];
        for (const item of this.heleRooster) {
            switch (this.tonen.toonClubDDWV) {
                case 1: // toonClubDDWV, 1 = toon clubdagen
                {
                    if (item.CLUB_BEDRIJF) {
                        tmpRooster.push(item);
                        continue;
                    }
                    break;
                }
                case 2: // toonClubDDWV, 2 = toon DDWV
                    if (item.DDWV) {
                        tmpRooster.push(item);
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
        if (this.diensten) {
            const lidDiensten = this.diensten.filter((dienst) => dienst.LID_ID!.toString() == ui!.LidData!.ID!.toString());
            this.ingedeeldMaand = lidDiensten.length;
        }
    }

    WeekKolomBreedte(kolommen: number): string {
        const breedte = 100 / kolommen;
        return 'width: calc(' + breedte + '% - 40px)';
    }

    // welke dagen willen we laten zien, DDWV'ers kunnen alleen DDWV dagen zien
    protected ToggleWeekendDDWV() {
        this.tonen.toonClubDDWV = ++this.tonen.toonClubDDWV % 3;
        this.applyRoosterFilter();
    }

    // Export naar excel in pivot view
    protected exportRooster() {
        const exportData: Record<string, string>[] = [];
        const legeDiensten: Record<string, string> = {};

        this.dienstTypes.forEach(dienst => legeDiensten[dienst.OMSCHRIJVING!] = "");

        this.filteredRooster.forEach(dag => {
            const d = DateTime.fromSQL(dag.DATUM!);

            const record = Object.assign({
                DATUM: d.day + "-" + d.month + "-" + d.year,    // Datum in juiste formaat zetten
                DDWV: dag.DDWV ? "X" : "-",
                CLUB_BEDRIJF: dag.CLUB_BEDRIJF ? "X" : "-",
                OPMERKINGEN: dag.OPMERKINGEN
            }, legeDiensten);

            dag.Diensten.forEach(dienst => {
                if (dienst) {
                    record[dienst.TYPE_DIENST!] = dienst.NAAM ?? "Dienst type onbekend";
                }
            });
            exportData.push(record)
        });

        const ws = xlsx.utils.json_to_sheet(exportData);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'rooster ' + this.datum.year + '-' + this.datum.month + ' ' + new Date().toJSON().slice(0, 10) + '.xlsx');
    }

    protected zetDatum(nieuweDatum: DateTime) {
        this.datum = nieuweDatum;
        this.opvragen();
    }
}
