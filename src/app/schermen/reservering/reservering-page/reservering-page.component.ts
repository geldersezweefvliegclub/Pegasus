import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faAvianex} from "@fortawesome/free-brands-svg-icons";
import {faCalendarCheck, faTimesCircle} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../../services/apiservice/login.service";
import {DateTime} from "luxon";
import {Subscription} from "rxjs";
import {
    HeliosBehaaldeProgressieDataset,
    HeliosLedenDataset,
    HeliosReserveringenDataset,
    HeliosRoosterDataset,
    HeliosStartDataset,
    HeliosVliegtuigenDataset
} from "../../../types/Helios";
import {LedenService} from "../../../services/apiservice/leden.service";
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {VliegtuigenService} from "../../../services/apiservice/vliegtuigen.service";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {DagVanDeWeek, getBeginEindDatumVanMaand} from "../../../utils/Utils";

import {ErrorMessage, SuccessMessage} from "../../../types/Utils";
import {ReserveringService} from "../../../services/apiservice/reservering.service";
import {KistSelectieComponent} from "../kist-selectie/kist-selectie.component";
import {StorageService} from "../../../services/storage/storage.service";
import {BoekingEditorComponent} from "../../../shared/components/editors/boeking-editor/boeking-editor.component";
import {StartEditorComponent} from "../../../shared/components/editors/start-editor/start-editor.component";
import {DaginfoService} from "../../../services/apiservice/daginfo.service";
import * as xlsx from "xlsx";
import {ProgressieService} from "../../../services/apiservice/progressie.service";

export type HeliosVliegtuigenDatasetExtended = HeliosVliegtuigenDataset & {
    Tonen?: boolean;
}

@Component({
    selector: 'app-reservering-page',
    templateUrl: './reservering-page.component.html',
    styleUrls: ['./reservering-page.component.scss']
})
export class ReserveringPageComponent implements OnInit, OnDestroy {
    @ViewChild(KistSelectieComponent) kistSelector: KistSelectieComponent;
    @ViewChild(BoekingEditorComponent) boeking: BoekingEditorComponent;
    @ViewChild(StartEditorComponent) startEditor: StartEditorComponent;

    readonly resetIcon: IconDefinition = faTimesCircle;
    readonly assignIcon: IconDefinition = faCalendarCheck;
    readonly reserveringIcon: IconDefinition = faAvianex;

    rooster: HeliosRoosterDataset[];
    filteredRooster: HeliosRoosterDataset[];

    private ledenAbonnement: Subscription;
    alleLeden: HeliosLedenDataset[];

    data: HeliosReserveringenDataset[] = [];
    reserveringView: string = "maand";            // toon rooster voor maand, week of dag
    zoekString: string;
    isLoading: boolean = false;
    magBoeken: boolean = false;
    magNogReserveren: boolean = false;

    private vliegtuigenAbonnement: Subscription;
    clubVliegtuigen: HeliosVliegtuigenDatasetExtended[];
    clubVliegtuigenFiltered: HeliosVliegtuigenDatasetExtended[];

    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    datum: DateTime = DateTime.now()                // de gekozen dag
    maandag: DateTime                               // de eerste dag van de week
    nu: DateTime = DateTime.now()                   // vandaag

    toonDatumKnoppen: boolean = false;              // Mag de gebruiker een andere datum kiezen
    toonClubDDWV: number = 2;                       // 0, gehele week, 1 = club dagen, 2 = alleen DDWV
    behaaldeCompetenties: string;
    magExporteren: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly loginService: LoginService,
                private readonly ledenService: LedenService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly reserveringenService: ReserveringService,
                private readonly progressieService: ProgressieService,
                private readonly roosterService: RoosterService,
                private readonly dagInfoService: DaginfoService,
                private readonly storageService: StorageService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        this.nu = DateTime.now();
        this.onWindowResize();

        const ui = this.loginService.userInfo?.Userinfo;
        if (ui!.isBeheerder || ui!.isBeheerderDDWV) {
            this.magBoeken = true;
        }
        this.toonDatumKnoppen = (ui!.isDDWV! || ui!.isClubVlieger!);

        this.onWindowResize();
        this.magExporteren = ui!.isClubVlieger!;

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1,
                })
                this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
                this.opvragen();
            }
        });

        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day,
            })
            this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
            this.opvragen();
        });

        // abonneer op wijziging van vliegtuigen
        this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
            this.clubVliegtuigen = vliegtuigen!.filter((v) => {
                return v.CLUBKIST!;
            });

            let bevoegdheden = "";
            const selectie: HeliosVliegtuigenDatasetExtended[] = this.storageService.ophalen("kistSelectieReservering")
            for (let i = 0; i < this.clubVliegtuigen.length; i++) {
                // opbouwen benodigde overland bevoegdheden als CSV string
                if (this.clubVliegtuigen[i].BEVOEGDHEID_OVERLAND_ID) {
                    bevoegdheden += (bevoegdheden) ? "," : "";
                    bevoegdheden += this.clubVliegtuigen[i].BEVOEGDHEID_OVERLAND_ID;
                }
                if (this.clubVliegtuigen[i].BEVOEGDHEID_LOKAAL_ID) {
                    bevoegdheden += (bevoegdheden) ? "," : "";
                    bevoegdheden += this.clubVliegtuigen[i].BEVOEGDHEID_LOKAAL_ID;
                }

                if (selectie == null) {
                    this.clubVliegtuigen[i].Tonen = true;
                } else {
                    const idx = selectie.findIndex(v => v.ID == this.clubVliegtuigen[i].ID)

                    if (idx < 0) {
                        this.clubVliegtuigen[i].Tonen = true;
                    } else {
                        this.clubVliegtuigen[i].Tonen = selectie[idx].Tonen
                    }
                }
            }

            // haal op welke vliegtuigen het ingelogde lid mag vliegen
            const ui = this.loginService.userInfo?.LidData!;
            this.progressieService.getProgressiesLid(ui.ID!, bevoegdheden).then((progressie: HeliosBehaaldeProgressieDataset[]) => {
                // We hebben nu array met progressie, omzetten naar CSV
                this.behaaldeCompetenties = progressie.map(function (elem) {
                    return elem.COMPETENTIE_ID;
                }).join(",");
            });

            this.storageService.opslaan("kistSelectieReservering", this.clubVliegtuigen)
            this.clubVliegtuigenFiltered = this.clubVliegtuigen!.filter((v) => {
                return v.Tonen!;
            });
        });

        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.alleLeden = (leden) ? leden : [];
        });

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize();
        });
    }

    ngOnDestroy() {
        if (this.ledenAbonnement) this.ledenAbonnement.unsubscribe();
        if (this.vliegtuigenAbonnement) this.vliegtuigenAbonnement.unsubscribe();
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    onWindowResize() {
        // als je geen datum mag aanpassen, zie alleen vandaag
        if (this.toonDatumKnoppen == false) {
            this.reserveringView = "dag"
        }
        else {
            if (this.sharedService.getSchermSize() <= SchermGrootte.sm) {
                this.reserveringView = "dag"
            } else if (this.sharedService.getSchermSize() >= SchermGrootte.xl) {
                this.reserveringView = "maand"
            } else {
                this.reserveringView = "week"
            }
        }

        if (this.datum) {
            this.opvragen();        // moeten wel een datum hebben, anders kunnen we niets opvragen
        }
    }

    opvragen(): void {
        const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

        let beginDatum: DateTime = beginEindDatum.begindatum;
        let eindDatum: DateTime = beginEindDatum.einddatum.plus({months: 2}); // datum 2 maanden vanaf nu, dan weten ook toekomstige reserveringen

        switch (this.reserveringView) {
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
        // We laden veel meer starts, dan de gekozen maand, en dat heeft een reden
        // Je mag maar 1 openstaande reservering hebben. In de functie magReserveren() wordt gekeken of er een openstaande reservering is
        // altijd vanaf vandaag controleren
        if (beginDatum > this.nu) {
            beginDatum = this.nu;
        }

        // als einde van de maand in het verleden is, kunnen we sowieso niet meer reserveren, beperk starts opvraag
        if (beginEindDatum.einddatum < this.nu) {
            eindDatum = beginEindDatum.einddatum;

            if (this.reserveringView == "week") {   // week kan in 2 maanden vallen, dus paar dagen extra opvragen
                const dagenExtra = 7 - eindDatum.weekday;
                eindDatum = eindDatum.plus({days: dagenExtra});
            }
        }
        this.roosterService.getRooster(beginDatum, eindDatum).then((rooster) => {
            this.rooster = rooster;
            this.applyRoosterFilter();

            this.reserveringenService.getReserveringen(beginDatum, eindDatum).then((dataset) => {
                this.data = (dataset) ? dataset : [];
                this.isLoading = false;

                // staat er nog een reserving open?
                // een reservering is iets anders dan een boeking
                // een reservering wordt gedaan door een lid, een boeking wordt gedaan door de beheerder
                // een boeking is bijvoorbeeld een NK, Euroglide etc
                // Je mag niet reserveren als er nog een reservering (in de toekomst) open staat
                // maar je mag wel reserveren als er een boeking open staat.
                // als starttoren mag je sowieso niet een kist reserveren

                if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
                    this.magNogReserveren = false;
                } else {
                    const ui = this.loginService.userInfo?.LidData
                    const idx = this.data.findIndex((reservering) => {
                        return ((reservering.LID_ID == ui?.ID) && (reservering.IS_GEBOEKT == false) && (DateTime.fromSQL(reservering.DATUM!) > this.nu))
                    });
                    this.magNogReserveren = (idx < 0);
                }
            }).catch(e => {
                this.error = e;
                this.isLoading = false;
            });
        })
    }

    // Laat hele rooster zien, of alleen weekend / DDWV
    applyRoosterFilter() {
        if (!this.rooster) return;      // rooster is nog niet geladen, we kunnen niets doen

        let tmpRooster: HeliosRoosterDataset[] = [];

        const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

        let beginDatum: DateTime = beginEindDatum.begindatum;
        let eindDatum: DateTime = beginEindDatum.einddatum.plus({months: 2}); // datum 2 maanden vanaf nu, dan weten ook toekomstige reserveringen

        switch (this.reserveringView) {
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
            case "maand": {
                eindDatum = beginEindDatum.einddatum               // alleen deze maand tonen
                break;
            }
        }

        for (let i = 0; i < this.rooster.length; i++) {

            const d: DateTime = DateTime.fromSQL(this.rooster[i].DATUM!)

            if ((d < beginDatum) || (d > eindDatum)) continue;      // we hebben starts in geheugen, maar tonen het niet

            switch (this.toonClubDDWV) {
                case 0: // toonClubDDWV, 0 = laat alle dagen zien, dus club dagen en DDWV dagen
                {
                    tmpRooster.push(this.rooster[i]);
                    continue;
                }
                case 1: // toonClubDDWV, 1 = toon clubdagen
                {
                    if (this.rooster[i].CLUB_BEDRIJF) {
                        tmpRooster.push(this.rooster[i]);
                        continue;
                    }
                    break;
                }
                case 2: // toonClubDDWV, 2 = toon DDWV
                    if (this.rooster[i].DDWV) {
                        tmpRooster.push(this.rooster[i]);
                        continue;
                    }
                    break;
            }
        }
        if (tmpRooster.length > 0) {
            this.filteredRooster = tmpRooster;
        } else {
            this.filteredRooster = this.rooster;
        }
    }

    // openen van popup om nieuwe start te kunnen invoeren
    toonKistSelectie(): void {
        this.kistSelector.openPopup();
    }

    // openen van popup om nieuwe start te kunnen invoeren
    nieuweBoeking(): void {
        this.boeking.openPopup();
    }

    // vanuit de reserveringspagina kun je een start aanmaken
    nieuweStart(datum: string, vliegtuigID: number): void {
        const reservering = this.data.find((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })

        if (reservering) {
            const d: DateTime = DateTime.fromSQL(datum);
            this.dagInfoService.getDagInfo(undefined, d).then((dagInfo) => {
                let start: HeliosStartDataset = {
                    DATUM: datum,
                    VLIEGTUIG_ID: vliegtuigID,
                    VLIEGER_ID: reservering.LID_ID,
                    STARTMETHODE_ID: dagInfo.STARTMETHODE_ID,
                    VELD_ID: dagInfo.VELD_ID
                }
                this.startEditor.openPopup(start);
            });
        }
    }

    ToggleWeekendDDWV() {
        this.toonClubDDWV = ++this.toonClubDDWV % 3; // 0, gehele week, 1 = club dagen, 2 = alleen DDWV

        // in week view laten we niet alleen de clubdagen zien (normaal alleen zaterdag en zondag)
        // schakel dus tussen ddwv dagen en de volledige week
        if (this.reserveringView == 'week' && this.toonClubDDWV == 1) {
            this.toonClubDDWV++;
        }
        this.applyRoosterFilter();
    }

    // Dit is al geimplementeerd in util.ts
    DagVanDeWeek(Datum: string) {
        return DagVanDeWeek(Datum);
    }

    // Ga de reservering nu vastleggen in de database
    toekennenReservering(datum: string, vliegtuigID: number) {
        const ui = this.loginService.userInfo;
        const r = {DATUM: datum, LID_ID: ui!.LidData!.ID, VLIEGTUIG_ID: vliegtuigID, NAAM: ui!.LidData?.NAAM}
        this.reserveringenService.addReservering(r).then();

        this.data.push(r);  // update grid zonder reload
        setTimeout(() => this.opvragen(), 1000);  // we gaan wel laatste reserveringen ophalen, er kan nog iemand bezig zijn
    }

    // De reservering is niet langer meer van toepassing
    verwijderReservering(datum: string, vliegtuigID: number) {
        const idx: number = this.data.findIndex((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })

        if (idx >= 0) {
            this.reserveringenService.deleteReservering(this.data[idx].ID!).then();
            this.data.splice(idx, 1);

            setTimeout(() => this.opvragen(), 1000);  // we gaan wel laatste reserveringen ophalen, er kan nog iemand bezig zijn
        }
    }

    // Door wie is de kist geboekt
    ToonNaam(datum: string, vliegtuigID: number): string {
        const reservering = this.data.find((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })

        if (reservering) {
            return reservering.NAAM!;
        }

        if (this.isVerleden(datum)) {      // datum is in het verleden, reserveren is niet meer mogelijk
            return "";
        }

        if (this.isClubBedrijf(datum)) {
            return "Club bedrijf"
        }

        return this.magReserveren(datum, vliegtuigID) ? "Beschikbaar" : "-";
    }

    // Door wie is de kist geboekt
    ToonOpmerking(datum: string, vliegtuigID: number): string | undefined {
        const reservering = this.data.find((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })

        if (reservering) {
            return reservering.OPMERKINGEN;
        }
        return undefined;
    }

    // Is de kist geboekt voor deze dag
    isBeschikbaar(datum: string, vliegtuigID: number): boolean {
        const reservering = this.data.find((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })
        return (!reservering);
    }

    // Is deze dag een club bedrijf
    isClubBedrijf(datum: string): boolean {
        const rooster = this.rooster.find((r) => {
            return (r.DATUM == datum);
        })
        return (rooster == undefined) ? false : rooster.CLUB_BEDRIJF!;
    }

    // is de datum in het verleden
    isVerleden(datum: string): boolean {
        return (DateTime.fromSQL(datum) < this.nu);
    }

    // is er een reserving die verwijderd mag worden
    magVerwijderen(datum: string, vliegtuigID: number): boolean {
        if (this.isVerleden(datum)) {      // datum is in het verleden, verwijderen is niet meer mogelijk
            return false;
        }

        const reservering = this.data.find((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })

        if (reservering == undefined) {
            return false;
        }

        const ui = this.loginService.userInfo;
        if (reservering.LID_ID == ui!.LidData!.ID) {
            return true;
        }

        return (ui?.Userinfo?.isBeheerder! || ui?.Userinfo?.isBeheerderDDWV!);
    }

    // Kan er een reservering gemaakt worden voor deze dag / vliegtuig. Reservering is mag maximaal 2 maanden in de toekomst zijn
    magReserveren(datum: string, vliegtuigID: number): boolean {
        // indien er nog een reservering open staat, mag er niet meer gereserveerd worden
        if (!this.magNogReserveren)
            return false;

        if (this.isVerleden(datum)) {      // datum is in het verleden, reserveren is niet meer mogelijk
            return false;
        }

        // Mag de ingelogde gebruiker vliegen op dit vliegtuig?
        const vliegtuig = this.clubVliegtuigen.find(v => v.ID == vliegtuigID);
        if (vliegtuig) {
            let magVliegen = false;
            if (!vliegtuig.BEVOEGDHEID_LOKAAL_ID && !vliegtuig.BEVOEGDHEID_OVERLAND_ID) {
                magVliegen = true;
            }
            else {
                if ((vliegtuig.BEVOEGDHEID_LOKAAL_ID) && this.behaaldeCompetenties.includes(vliegtuig.BEVOEGDHEID_LOKAAL_ID.toString())) {
                    magVliegen = true;
                }
                if ((vliegtuig.BEVOEGDHEID_OVERLAND_ID) && this.behaaldeCompetenties.includes(vliegtuig.BEVOEGDHEID_OVERLAND_ID.toString())) {
                    magVliegen = true;
                }
            }

            if (!magVliegen) {
                return false;
            }
        }

        if (!this.isBeschikbaar(datum, vliegtuigID)) {
            return false;
        }

        // maximaal 2 maanden vanaf nu kunnen we een reservering maken
        const eindDatum: DateTime = DateTime.now().plus({months: 2});
        if (DateTime.fromSQL(datum) > eindDatum) {
            return false;
        }

        // Op clubdagen is geen reservering mogelijk
        return (!this.isClubBedrijf(datum))
    }

    // html class om info te tonen
    htmlClassReservering(datum: string, vliegtuigID: number): string {
        if (!this.isBeschikbaar(datum, vliegtuigID)) {
            return "reservering";
        }

        return (this.magReserveren(datum, vliegtuigID)) ? "beschikbaar" : "nietBeschikbaar";
    }

    // in popup is gekozen om vliegtuig wel of niet te tonen in het grid
    // hiermee worden er minder vligetuigen getoond en past het beter op het scherm
    // Wordt bovendien opgeslagen zodat we het kunnen toepassen wanneer de gebruiker opnieuw inlogt
    changeTonen(vliegtuigID: any) {
        const idx = this.clubVliegtuigen.findIndex(v => v.ID == vliegtuigID);
        this.clubVliegtuigen[idx].Tonen = !this.clubVliegtuigen[idx].Tonen;
        this.storageService.opslaan("kistSelectieReservering", this.clubVliegtuigen);

        this.clubVliegtuigenFiltered = this.clubVliegtuigen!.filter((v) => {
            return v.Tonen!;
        });
    }

    // we maken het makkelijk om een start vanuit de reservering aan te maken
    toonStartButton(datum: string, vliegtuigID: number): boolean {
        if (this.nu.toISODate() != datum || this.isBeschikbaar(datum, vliegtuigID)) {
            return false;
        }
        let rooster: HeliosRoosterDataset | undefined = this.rooster.find((dag) => datum == dag.DATUM!)

        if (rooster) {
            if (rooster!.CLUB_BEDRIJF) return false;            // het is een Clubdag, dan geen start button
        }

        const ui = this.loginService.userInfo?.Userinfo;
        return (ui!.isBeheerder || ui!.isBeheerderDDWV || ui!.isDDWVCrew) ? true : false;
    }

    // Export naar excel
    exportDataset() {
        // berperk het tot deze maand
        const toExcel = this.data.filter((r) => {
            const d: DateTime = DateTime.fromSQL(r.DATUM!);

            return (d.year == this.datum.year && d.month == this.datum.month);
        });

        const ws = xlsx.utils.json_to_sheet(toExcel);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'reserveringen ' + new Date().toJSON().slice(0, 10) + '.xlsx');
    }

    zetDatum(nieuweDatum: DateTime) {
        const opvragen: boolean = this.datum.month != nieuweDatum.month

        this.datum = nieuweDatum;
        this.maandag = this.datum.startOf('week');     // de eerste dag van de gekozen week

        if (opvragen) {
            this.opvragen();            // gaan naar nieuwe maand, dus opvragen van database
        } else {
            this.applyRoosterFilter();  // zorg dat we de juiste starts hebben om weer te geven
        }
    }
}
