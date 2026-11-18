import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faAvianex } from '@fortawesome/free-brands-svg-icons';
import { faCalendarCheck, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { LoginService } from '../../../services/apiservice/login.service';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import {
  HeliosBehaaldeProgressieDataset,
  HeliosLedenDataset,
  HeliosReserveringenDataset,
  HeliosRoosterDataset,
  HeliosVliegtuigenDataset,
} from '../../../types/Helios';
import { LedenService } from '../../../services/apiservice/leden.service';
import { SchermGrootte, SharedService } from '../../../services/shared/shared.service';
import { VliegtuigenService } from '../../../services/apiservice/vliegtuigen.service';
import { RoosterService } from '../../../services/apiservice/rooster.service';
import { DagVanDeWeek, getBeginEindDatumVanMaand } from '../../../utils/Utils';

import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import { ReserveringService } from '../../../services/apiservice/reservering.service';
import { KistSelectieComponent } from '../kist-selectie/kist-selectie.component';
import { StorageService } from '../../../services/storage/storage.service';
import { BoekingEditorComponent } from '../../../shared/components/editors/boeking-editor/boeking-editor.component';
import { StartEditorComponent } from '../../../shared/components/editors/start-editor/start-editor.component';
import { DaginfoService } from '../../../services/apiservice/daginfo.service';
import * as xlsx from 'xlsx';
import { ProgressieService } from '../../../services/apiservice/progressie.service';
import { ErrorComponent } from '../../../shared/components/error/error.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';
import { SuccessComponent } from '../../../shared/components/success/success.component';

export type HeliosVliegtuigenDatasetExtended = HeliosVliegtuigenDataset & {
    Tonen?: boolean;
}

@Component({
    selector: 'app-reservering-page',
    templateUrl: './reservering-page.component.html',
    styleUrls: ['./reservering-page.component.scss'],
    imports: [
        ErrorComponent,
        IconButtonComponent,
        PegasusCardComponent,
        SuccessComponent,
        KistSelectieComponent,
        BoekingEditorComponent,
        StartEditorComponent,
        FormsModule,
        NgClass,
        NgTemplateOutlet,
        DatePipe,
        FaIconComponent
    ]
})
export class ReserveringPageComponent implements OnInit, OnDestroy {
    // variablen in html formulier
    protected readonly boeking = viewChild.required(BoekingEditorComponent);
    protected readonly resetIcon: IconDefinition = faTimesCircle;
    protected readonly assignIcon: IconDefinition = faCalendarCheck;
    protected readonly reserveringIcon: IconDefinition = faAvianex;
    protected readonly magBoeken = (this.userInfo?.isBeheerder || this.userInfo?.isBeheerderDDWV) ?? false;
    protected readonly toonDatumKnoppen = (this.userInfo?.isDDWV || this.userInfo?.isClubVlieger) ?? false;     // Mag de gebruiker een andere datum kiezen
    protected readonly magExporteren = this.userInfo?.isClubVlieger ?? false;

    protected filteredRooster: HeliosRoosterDataset[];
    protected data: HeliosReserveringenDataset[] = [];
    protected reserveringView = "maand";            // toon rooster voor maand, week of dag
    protected magNogReserveren = false;
    protected clubVliegtuigen: HeliosVliegtuigenDatasetExtended[];
    protected clubVliegtuigenFiltered: HeliosVliegtuigenDatasetExtended[];
    protected datum: DateTime = DateTime.now()                // de gekozen dag
    protected maandag: DateTime                               // de eerste dag van de week
    protected success: SuccessMessage | undefined;
    protected error: ErrorMessage | undefined;

    // private variable voor ts script
    private readonly loginService = inject(LoginService);
    private readonly ledenService = inject(LedenService);
    private readonly vliegtuigenService = inject(VliegtuigenService);
    private readonly reserveringenService = inject(ReserveringService);
    private readonly progressieService = inject(ProgressieService);
    private readonly roosterService = inject(RoosterService);
    private readonly dagInfoService = inject(DaginfoService);
    private readonly storageService = inject(StorageService);
    private readonly sharedService = inject(SharedService);
    private readonly kistSelector = viewChild.required(KistSelectieComponent);
    private readonly userInfo = this.loginService.userInfo?.Userinfo;

    private rooster: HeliosRoosterDataset[];
    private ledenAbonnement: Subscription;
    private alleLeden: HeliosLedenDataset[];
    private isLoading = false;
    private roosterPeriode: { beginDatum: DateTime, eindDatum: DateTime } | undefined;   // periode van het opgehaalde rooster
    private vliegtuigenAbonnement: Subscription;
    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    private nu: DateTime = DateTime.now()                   // vandaag
    private toonClubDDWV = 2;                       // 0, gehele week, 1 = club dagen, 2 = alleen DDWV
    private behaaldeCompetenties: string;

    ngOnInit(): void {
        this.bepaalDagWeek()

        this.reserveringenService.MagNogReserveren().then((magNogReserveren) => {
            this.magNogReserveren = magNogReserveren;
        });

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
            const selectie: HeliosVliegtuigenDatasetExtended[] | null = this.storageService.ophalen("kistSelectieReservering") as HeliosVliegtuigenDatasetExtended[] | null
            for (const item of this.clubVliegtuigen) {
                // opbouwen benodigde overland bevoegdheden als CSV string
                if (item.BEVOEGDHEID_OVERLAND_ID) {
                    bevoegdheden += (bevoegdheden) ? "," : "";
                    bevoegdheden += item.BEVOEGDHEID_OVERLAND_ID;
                }
                if (item.BEVOEGDHEID_LOKAAL_ID) {
                    bevoegdheden += (bevoegdheden) ? "," : "";
                    bevoegdheden += item.BEVOEGDHEID_LOKAAL_ID;
                }

                if (selectie == null) {
                    item.Tonen = true;
                } else {
                    const idx = selectie.findIndex(v => v.ID == item.ID)

                    if (idx < 0) {
                        item.Tonen = true;
                    } else {
                        item.Tonen = selectie[idx].Tonen
                    }
                }
            }

            // haal op welke vliegtuigen het ingelogde lid mag vliegen
            const ui = this.loginService.userInfo?.LidData;
            this.progressieService.getProgressiesLid(ui?.ID ?? -1, bevoegdheden).then((progressie: HeliosBehaaldeProgressieDataset[]) => {
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
        this.resizeSubscription = this.sharedService.onResize$.subscribe(() => {
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

    private bepaalDagWeek(): void {
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
    }

    private onWindowResize() {
        this.bepaalDagWeek()

        if (this.datum) {
            this.opvragen();        // moeten wel een datum hebben, anders kunnen we niets opvragen
        }
    }

    protected opvragen(): void {
        this.opvragenRooster();
        this.opvragenReserveringen();
    }

    // Laat hele rooster zien, of alleen weekend / DDWV
    private applyRoosterFilter() {
        if (!this.rooster) return;      // rooster is nog niet geladen, we kunnen niets doen

        const tmpRooster: HeliosRoosterDataset[] = [];

        const { beginDatum, eindDatum } = this.getPeriode();

        for (const item of this.rooster) {

            const d: DateTime = DateTime.fromSQL(item.DATUM!)

            if ((d < beginDatum) || (d > eindDatum)) continue;      // we hebben starts in geheugen, maar tonen het niet

            switch (this.toonClubDDWV) {
                case 0: // toonClubDDWV, 0 = laat alle dagen zien, dus club dagen en DDWV dagen
                {
                    tmpRooster.push(item);
                    break;
                }
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
        if (tmpRooster.length > 0) {
            this.filteredRooster = tmpRooster;
        } else {
            this.filteredRooster = this.rooster;
        }
    }

    // openen van popup om nieuwe start te kunnen invoeren
    protected toonKistSelectie(): void {
        this.kistSelector().openPopup();
    }

    // openen van popup om nieuwe start te kunnen invoeren
    protected nieuweBoeking(): void {
        this.boeking().openPopup();
    }

    protected ToggleWeekendDDWV() {
        this.toonClubDDWV = ++this.toonClubDDWV % 3; // 0, gehele week, 1 = club dagen, 2 = alleen DDWV

        // in week view laten we niet alleen de clubdagen zien (normaal alleen zaterdag en zondag)
        // schakel dus tussen ddwv dagen en de volledige week
        if (this.reserveringView == 'week' && this.toonClubDDWV == 1) {
            this.toonClubDDWV++;
        }
        this.applyRoosterFilter();
    }

    // Dit is al geimplementeerd in util.ts
    protected DagVanDeWeek(Datum: string) {
        return DagVanDeWeek(Datum);
    }

    // Ga de reservering nu vastleggen in de database
    protected toekennenReservering(datum: string, vliegtuigID: number) {
        const ui = this.loginService.userInfo;
        const r = {DATUM: datum, LID_ID: ui!.LidData!.ID, VLIEGTUIG_ID: vliegtuigID, NAAM: ui!.LidData?.NAAM}
        this.reserveringenService.addReservering(r).then(() => {

            // we hebben een nieuwe reservering, dus we moeten opnieuw bepalen of er nog reserveringen gemaakt mogen worden
            this.reserveringenService.MagNogReserveren().then((magNogReserveren) => {
                this.magNogReserveren = magNogReserveren;
            });
        });

        this.data.push(r);  // update grid zonder reload
        setTimeout(() => this.opvragenReserveringen(), 1000);  // we gaan wel laatste reserveringen ophalen, er kan nog iemand bezig zijn
    }

    // De reservering is niet langer meer van toepassing
    protected verwijderReservering(datum: string, vliegtuigID: number) {
        const idx: number = this.data.findIndex((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })

        if (idx >= 0) {
            this.reserveringenService.deleteReservering(this.data[idx].ID!).then(() => {
                // we hebben een reservering verwijderd, dus we moeten opnieuw bepalen of er nog reserveringen gemaakt mogen worden
                this.reserveringenService.MagNogReserveren().then((magNogReserveren) => {
                    this.magNogReserveren = magNogReserveren;
                });
            });
            this.data.splice(idx, 1);

            setTimeout(() => this.opvragenReserveringen(), 1000);  // we gaan wel laatste reserveringen ophalen, er kan nog iemand bezig zijn
        }
    }

    // Door wie is de kist geboekt
    protected ToonNaam(datum: string, vliegtuigID: number): string {
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
    protected ToonOpmerking(datum: string, vliegtuigID: number): string | undefined {
        const reservering = this.data.find((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })

        if (reservering) {
            return reservering.OPMERKINGEN ?? undefined;
        }
        return undefined;
    }

    // Is de kist geboekt voor deze dag
    private isBeschikbaar(datum: string, vliegtuigID: number): boolean {
        const reservering = this.data.find((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })
        return (!reservering);
    }

    // Is deze dag een club bedrijf
    protected isClubBedrijf(datum: string): boolean {
        const rooster = this.rooster.find((r) => {
            return (r.DATUM == datum);
        })
        return (rooster == undefined) ? false : rooster.CLUB_BEDRIJF!;
    }

    // is de datum in het verleden
    private isVerleden(datum: string): boolean {
        return (DateTime.fromSQL(datum) < this.nu);
    }

    // is er een reserving die verwijderd mag worden
    protected magVerwijderen(datum: string, vliegtuigID: number): boolean {
        const ui = this.loginService.userInfo;
        if (this.isVerleden(datum) && !ui?.Userinfo?.isBeheerder) {      // datum is in het verleden, verwijderen is niet meer mogelijk, behalve voor beheerder
            return false;
        }

        const reservering = this.data.find((reservering) => {
            return (reservering.DATUM == datum && reservering.VLIEGTUIG_ID == vliegtuigID)
        })

        if (reservering == undefined) {
            return false;
        }

        if (reservering.LID_ID == ui!.LidData!.ID) {
            return true;
        }

        return (ui?.Userinfo?.isBeheerder || ui?.Userinfo?.isBeheerderDDWV) ?? false;
    }

    // Kan er een reservering gemaakt worden voor deze dag / vliegtuig. Reservering is mag maximaal 2 maanden in de toekomst zijn
    protected magReserveren(datum: string, vliegtuigID: number): boolean {
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
    protected htmlClassReservering(datum: string, vliegtuigID: number): string {
        if (!this.isBeschikbaar(datum, vliegtuigID)) {
            return "reservering";
        }

        return (this.magReserveren(datum, vliegtuigID)) ? "beschikbaar" : "nietBeschikbaar";
    }

    // in popup is gekozen om vliegtuig wel of niet te tonen in het grid
    // hiermee worden er minder vligetuigen getoond en past het beter op het scherm
    // Wordt bovendien opgeslagen zodat we het kunnen toepassen wanneer de gebruiker opnieuw inlogt
    protected changeTonen(vliegtuigID: number) {
        const idx = this.clubVliegtuigen.findIndex(v => v.ID == vliegtuigID);
        this.clubVliegtuigen[idx].Tonen = !this.clubVliegtuigen[idx].Tonen;
        this.storageService.opslaan("kistSelectieReservering", this.clubVliegtuigen);

        this.clubVliegtuigenFiltered = this.clubVliegtuigen!.filter((v) => {
            return v.Tonen!;
        });
    }

    // Export naar excel
    protected exportDataset() {
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

    protected zetDatum(nieuweDatum: DateTime) {
        const opvragen: boolean = this.datum.month != nieuweDatum.month

        this.datum = nieuweDatum;
        this.maandag = this.datum.startOf('week');     // de eerste dag van de gekozen week

        if (opvragen || this.reserveringView == "dag") {
            this.opvragen();
        } else if (!this.roosterBevatPeriode()) {
            this.opvragenRooster();     // bijv. week view, de nieuwe week zit nog niet in het opgehaalde rooster
        } else {
            this.applyRoosterFilter();  // zorg dat we de juiste starts hebben om weer te geven
        }
    }

    // het rooster is alleen nodig voor de getoonde periode
    private opvragenRooster(): void {
        const periode = this.getPeriode();
        this.roosterPeriode = periode;

        this.roosterService.getRooster(periode.beginDatum, periode.eindDatum).then((rooster) => {
            this.rooster = rooster;
            this.applyRoosterFilter();
        });
    }

    // reserveringen halen we in de maand view 2 maanden vooruit op, zodat we ook toekomstige reserveringen weten
    private opvragenReserveringen(): void {
        const { beginDatum, eindDatum } = this.getPeriode(true);

        this.reserveringenService.getReserveringen(beginDatum, eindDatum).then((dataset) => {
            this.data = (dataset) ? dataset : [];
            this.isLoading = false;
        }).catch(e => {
            this.error = e;
            this.isLoading = false;
        });
    }

    // de getoonde periode, afhankelijk van dag / week / maand view
    private getPeriode(metToekomstigeReserveringen = false): { beginDatum: DateTime, eindDatum: DateTime } {
        switch (this.reserveringView) {
            case "dag":
                return { beginDatum: this.datum, eindDatum: this.datum };
            case "week":
                return { beginDatum: this.datum.startOf('week'), eindDatum: this.datum.endOf('week') };    // kan in de vorige / volgende maand vallen
            default: {
                const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);
                const eindDatum = metToekomstigeReserveringen ? beginEindDatum.einddatum.plus({months: 2}) : beginEindDatum.einddatum;
                return { beginDatum: beginEindDatum.begindatum, eindDatum: eindDatum };
            }
        }
    }

    // valt de getoonde periode binnen het rooster dat we al opgehaald hebben
    private roosterBevatPeriode(): boolean {
        const periode = this.getPeriode();
        return this.roosterPeriode !== undefined
            && periode.beginDatum >= this.roosterPeriode.beginDatum
            && periode.eindDatum <= this.roosterPeriode.eindDatum;
    }
}
