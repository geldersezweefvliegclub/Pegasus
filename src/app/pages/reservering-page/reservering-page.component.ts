import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faAvianex} from "@fortawesome/free-brands-svg-icons";
import {faCalendarCheck, faTimesCircle} from "@fortawesome/free-solid-svg-icons";
import {LoginService} from "../../services/apiservice/login.service";
import {DateTime, Info} from "luxon";
import {Subscription} from "rxjs";
import {
    HeliosLedenDataset, HeliosReserveringenDataset,
    HeliosRoosterDataset, HeliosStartDataset,
    HeliosVliegtuigenDataset
} from "../../types/Helios";
import {LedenService} from "../../services/apiservice/leden.service";
import {SharedService} from "../../services/shared/shared.service";
import {VliegtuigenService} from "../../services/apiservice/vliegtuigen.service";
import {RoosterService} from "../../services/apiservice/rooster.service";
import {DagVanDeWeek} from "../../utils/Utils";

import {ErrorMessage, SuccessMessage} from "../../types/Utils";
import {ReserveringService} from "../../services/apiservice/reservering.service";
import {KistSelectieComponent} from "./kist-selectie/kist-selectie.component";
import {StorageService} from "../../services/storage/storage.service";
import {BoekingEditorComponent} from "../../shared/components/editors/boeking-editor/boeking-editor.component";
import {StartEditorComponent} from "../../shared/components/editors/start-editor/start-editor.component";
import {DaginfoService} from "../../services/apiservice/daginfo.service";
import * as xlsx from "xlsx";

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

    private roosterAbonnement: Subscription;
    rooster: HeliosRoosterDataset[];
    filteredRooster: HeliosRoosterDataset[];

    private ledenAbonnement: Subscription;
    alleLeden: HeliosLedenDataset[];

    data: HeliosReserveringenDataset[] = [];
    zoekString: string;
    isLoading: boolean = false;
    magBoeken: boolean = false;
    magNogReserveren: boolean = false;

    private vliegtuigenAbonnement: Subscription;
    clubVliegtuigen: HeliosVliegtuigenDatasetExtended[];
    clubVliegtuigenFiltered: HeliosVliegtuigenDatasetExtended[];

    private datumAbonnement: Subscription; // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag
    nu: DateTime                           // vandaag

    toonClubDDWV: number = 2;              // 0, gehele week, 1 = club dagen, 2 = alleen DDWV

    magExporteren: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly loginService: LoginService,
                private readonly ledenService: LedenService,
                private readonly vliegtuigenService: VliegtuigenService,
                private readonly reserveringenService: ReserveringService,
                private readonly roosterService: RoosterService,
                private readonly dagInfoService: DaginfoService,
                private readonly storageService: StorageService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        this.nu = DateTime.now();

        const ui = this.loginService.userInfo?.Userinfo;
        if (ui!.isBeheerder || ui!.isBeheerderDDWV) {
            this.magBoeken = true;
        }
        this.magExporteren = ui!.isClubVlieger!;

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            this.datum = DateTime.fromObject({
                year: jaarMaand.year,
                month: jaarMaand.month,
                day: 1
            })
            this.filteredRooster = [];
            this.opvragen();
        })

        // abonneer op wijziging van vliegtuigen
        this.vliegtuigenAbonnement = this.vliegtuigenService.vliegtuigenChange.subscribe(vliegtuigen => {
            this.clubVliegtuigen = vliegtuigen!.filter((v) => {
                return v.CLUBKIST!;
            });

            const selectie: HeliosVliegtuigenDatasetExtended[] = this.storageService.ophalen("kistSelectieReservering")
            for (let i = 0; i < this.clubVliegtuigen.length; i++) {
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
            this.storageService.opslaan("kistSelectieReservering", this.clubVliegtuigen)
            this.clubVliegtuigenFiltered = this.clubVliegtuigen!.filter((v) => {
                return v.Tonen!;
            });
        });

        // abonneer op wijziging van leden
        this.ledenAbonnement = this.ledenService.ledenChange.subscribe(leden => {
            this.alleLeden = (leden) ? leden : [];
        });

        // abonneer op wijziging van rooster
        this.roosterAbonnement = this.roosterService.roosterChange.subscribe(maandRooster => {
            this.rooster = maandRooster!
            this.applyRoosterFilter();
        });
    }

    ngOnDestroy() {
        if (this.ledenAbonnement) this.ledenAbonnement.unsubscribe();
        if (this.vliegtuigenAbonnement) this.vliegtuigenAbonnement.unsubscribe();
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.roosterAbonnement) this.roosterAbonnement.unsubscribe();
    }

    // Opvragen van de data via de api
    opvragen() {
        this.isLoading = true;

        // We laden veel meer data, dan de gekozen maand, en dat heeft een reden
        // Je mag maar 1 openstaande reservering hebben. In de functie magReserveren() wordt gekeken of er een openstaande reservering is
        const beginDatum: DateTime = DateTime.fromObject({day: 1, month: this.nu.month, year: this.nu.year});   // begin van de maand
        const eindDatum: DateTime = this.datum.plus({months: 2}); // datum 2 maanden vanaf nu, dan weten ook toekomstige reserveringen

        this.reserveringenService.getReserveringen(beginDatum, eindDatum).then((dataset) => {
            this.data = (dataset) ? dataset : [];
            this.isLoading = false;

            // staat er nog een reserving open?
            // een reservering is iets anders dan een boeking
            // een reservering wordt gedaan door een lid, een boeking wordt gedaan door de beheerder
            // een boeking is bijvoorbeeld een NK, Euroglide etc
            // Je mag niet reserveren als er nog een reservering (in de toekomst) open staat
            // maar je mag wel reserveren als er een boeking open staat.

            const ui = this.loginService.userInfo?.LidData
            const idx = this.data.findIndex((reservering) => {
                return ((reservering.LID_ID == ui?.ID) && (reservering.IS_GEBOEKT == false) && (DateTime.fromSQL(reservering.DATUM!) > this.nu))
            });
            this.magNogReserveren = (idx < 0);
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });
    }

    // Laat hele rooster zien, of alleen weekend / DDWV
    applyRoosterFilter() {
        // toonClubDDWV, 0 = laat alle dagen zien, dus club dagen en DDWV dagen
        if (this.toonClubDDWV == 0) {
            this.filteredRooster = this.rooster;
            return;
        }

        let tmpRooster: HeliosRoosterDataset[] = [];
        for (let i = 0; i < this.rooster.length; i++) {
            switch (this.toonClubDDWV) {
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
            const d:DateTime = DateTime.fromSQL(datum);
            const dagInfo = this.dagInfoService.getDagInfo(undefined, d).then((dagInfo) => {

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
        this.toonClubDDWV = ++this.toonClubDDWV % 3;
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
        this.reserveringenService.addReservering(r);

        this.data.push(r);  // update grid zonder reload
        setTimeout(() => this.opvragen(), 1000);  // we gaan wel laatste reserveringen ophalen, er kan nog iemand bezig zijn
    }

    // De reservering is niet langer meer van toepassing
    verwijderReservering(datum: string, vliegtuigID: number) {
        const idx: number = this.data.findIndex((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })

        if (idx >= 0) {
            this.reserveringenService.deleteReservering(this.data[idx].ID!);
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
    ToonOpmerking(datum: string, vliegtuigID: number): string|undefined {
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
        return (reservering) ? false : true;
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
        return (DateTime.fromSQL(datum) < this.nu) ? true : false;
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

            return (d.year == this.datum.year  && d.month == this.datum.month);
        });

        var ws = xlsx.utils.json_to_sheet(toExcel);
        const wb: xlsx.WorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Blad 1');
        xlsx.writeFile(wb, 'reserveringen ' + new Date().toJSON().slice(0,10) +'.xlsx');
    }

}
