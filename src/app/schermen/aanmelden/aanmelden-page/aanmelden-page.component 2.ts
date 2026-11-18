import { Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faInfoCircle, faStreetView } from '@fortawesome/free-solid-svg-icons';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, skip } from 'rxjs/operators';
import { SchermGrootte, SharedService } from '../../../services/shared/shared.service';
import { DagVanDeWeek, DateDiff } from '../../../utils/Utils';
import { DateTime } from 'luxon';
import {
    HeliosAanwezigLedenDataset, HeliosBehaaldeProgressieDataset,
    HeliosDagInfosDataset,
    HeliosDienstenDataset,
    HeliosRoosterDataset,
    HeliosType,
} from '../../../types/Helios';
import { RoosterService } from '../../../services/apiservice/rooster.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import {
    LidAanwezigEditorComponent,
} from '../../../shared/components/editors/lid-aanwezig-editor/lid-aanwezig-editor.component';
import { LoginService } from '../../../services/apiservice/login.service';
import { AanwezigLedenService } from '../../../services/apiservice/aanwezig-leden.service';
import { DienstenService } from '../../../services/apiservice/diensten.service';
import { TypesService } from '../../../services/apiservice/types.service';
import { PegasusConfigService } from '../../../services/shared/pegasus-config.service';
import { DaginfoService } from '../../../services/apiservice/daginfo.service';
import {ErrorMessage, KeyValueArray} from '../../../types/Utils';
import { SamenvattingComponent } from '../samenvatting/samenvatting.component';
import {ProgressieService} from "../../../services/apiservice/progressie.service";
import { NgTemplateOutlet, AsyncPipe, NgClass } from '@angular/common';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from '../../../shared/components/error/error.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';

export interface TrancactiesDDWV {
    AANGEMELD: boolean,
    AFGEMELD: boolean,
    STRIPPEN: number
}

export type HeliosAanwezigLedenDatasetExtended = HeliosAanwezigLedenDataset & {
    AFGEMELD: boolean
    DDWV : TrancactiesDDWV
}

@Component({
    selector: 'app-aanmelden-page',
    templateUrl: './aanmelden-page.component.html',
    styleUrls: ['./aanmelden-page.component.scss'],
    imports: [ErrorComponent, IconButtonComponent, LidAanwezigEditorComponent, ModalComponent, NgSelectComponent, FormsModule, NgTemplateOutlet, PegasusCardComponent, SamenvattingComponent, FaIconComponent, RouterLink, AsyncPipe, NgClass]
})
class AanmeldenPageComponent implements OnInit, OnDestroy {
    // variablen in html formulier
    protected readonly aanmeldenIcon: IconDefinition = faStreetView;
    protected readonly infoIcon: IconDefinition = faInfoCircle;
    protected readonly DagVanDeWeek = DagVanDeWeek;

    protected datum: DateTime = DateTime.now();               // de gekozen dag
    protected maandag: DateTime                               // de eerste dag van de week
    protected error: ErrorMessage | undefined;
    protected afmeldDatumDMY: string;                         // De datum waarop we ons afmelden
    protected aanmeldenView = "week";
    protected rooster: HeliosRoosterDataset[];                // rooster voor gekozen periode (dag/week/maand)
    protected diensten: HeliosDienstenDataset[];              // Wie hebben er dienst
    protected aanmeldingen: HeliosAanwezigLedenDataset[];     // De aanmeldingen
    protected isLoadingRooster = false;
    protected isLoadingDiensten = false;
    protected isLoadingAanwezig = false;
    protected toonDatumKnoppen = false;              // Mag de gebruiker een andere datum kiezen
    protected isDDWVer = false;                      // DDWV'ers mogen geen club dagen zien
    protected isBeheerder = false;                   // Beheerders mogen meer zien
    protected isBeheerderDDWV = false;               // Beheerders mogen meer zien
    protected veldTypes$: Observable<HeliosType[]>;
    protected vliegveld: number | undefined;                      // laat aanmeldingen van een speciek vliegveld zien

    // private variable voor ts script
    private readonly typesService = inject(TypesService);
    private readonly loginService = inject(LoginService);
    private readonly sharedService = inject(SharedService);
    private readonly roosterService = inject(RoosterService);
    private readonly daginfoService = inject(DaginfoService);
    private readonly dienstenService = inject(DienstenService);
    private readonly configService = inject(PegasusConfigService);
    private readonly progressieService = inject(ProgressieService);
    private readonly aanwezigLedenService = inject(AanwezigLedenService);
    private readonly bevestigAfmeldenPopup = viewChild.required(ModalComponent);
    private readonly aanmeldEditor = viewChild.required(LidAanwezigEditorComponent);
    private readonly samenvattingPopup = viewChild.required(SamenvattingComponent);

    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    private opvragenAbonnement: Subscription;
    private aanwezigLedenAbonnement: Subscription;  // Wie zijn er op welke dag aanwezig
    private typesAbonnement: Subscription;
    private magAanmeldenDDWV: boolean;
    private afmeldDatum: DateTime;
    private opvragenTrigger = new Subject<void>();      // alle verzoeken om data op te halen komen hier samen
    private ophaalVolgnummer = 0;                           // negeer antwoorden van verouderde verzoeken
    private filteredAanmeldingen: HeliosAanwezigLedenDataset[];     // De aanmeldingen na filteren
    private dagInfo: HeliosDagInfosDataset[];                       // De bijhorende dag info

    ngOnInit(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.isDDWVer = ui!.isDDWV ?? false;
        this.isBeheerder = ui!.isBeheerder ?? false;
        this.isBeheerderDDWV = ui!.isBeheerderDDWV ?? false;

        this.toonDatumKnoppen = (ui!.isDDWV! || ui!.isClubVlieger!);

        // alle triggers samenvoegen, zodat kort na elkaar binnenkomende verzoeken maar 1x data ophalen
        this.opvragenAbonnement = this.opvragenTrigger.pipe(debounceTime(300)).subscribe(() => this.ophalen());

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.zetDatum(DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1,
                }));
            }
        })

        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.zetDatum(DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day,
            }))
        });

        // abonneer op wijziging van aanwezige leden, de eerste (opgeslagen) waarde overslaan want datumAbonnement haalt de data al op
        this.aanwezigLedenAbonnement = this.aanwezigLedenService.aanwezigChange.pipe(skip(1)).subscribe((_) => {
            this.opvragen();        // kunnen dataset die normaal in subscribe payload zit niet gebruiken omdat we hier ander tijdspanne gebruiken
        });

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(() => {
            this.opvragen();
        });

        // abonneer op wijziging van types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.veldTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 9}));            // vliegvelden
        });


        const competentieIDs = (this.configService.DDWVtoestemmingID() !== undefined) ? this.configService.DDWVtoestemmingID().toString() + "," + this.configService.DDWVvragenlijstID().toString() :this.configService.DDWVvragenlijstID().toString();
        this.progressieService.getProgressiesLid(this.loginService.userInfo!.LidData?.ID!, competentieIDs).then((progressie:  HeliosBehaaldeProgressieDataset[]) => {
            const toestemming = progressie.some(p => p.COMPETENTIE_ID == this.configService.DDWVtoestemmingID()) ? true : false;
            const vragenlijst = progressie.some(p => p.COMPETENTIE_ID == this.configService.DDWVvragenlijstID()) ? true : false;

            if (ui?.isClubVlieger)
            {
                this.magAanmeldenDDWV = toestemming && vragenlijst;
            }
            else
            {
                this.magAanmeldenDDWV = vragenlijst;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
        if (this.aanwezigLedenAbonnement) this.aanwezigLedenAbonnement.unsubscribe();
        if (this.opvragenAbonnement) this.opvragenAbonnement.unsubscribe();
    }

    private onWindowResize() {
        // als je geen datum mag aanpassen, zie alleen vandaag
        if (!this.toonDatumKnoppen) {
            this.aanmeldenView = "dag"
        } else if (this.sharedService.getSchermSize() <= SchermGrootte.sm) {
            this.aanmeldenView = "dag";
        } else {
            this.aanmeldenView = "week";
        }
    }

    // verzoek om data op te halen, wordt via opvragenTrigger gebundeld
    protected opvragen(): void {
        this.opvragenTrigger.next();
    }

    private ophalen(): void {
        let beginDatum: DateTime;
        let eindDatum: DateTime;

        this.onWindowResize();  // bepaal wat we moeten tonen dag/week/maand
        const volgnummer = ++this.ophaalVolgnummer;

        switch (this.aanmeldenView) {
            case "dag" : {
                beginDatum = this.datum;
                eindDatum = this.datum;
                break;
            }
            case "week":
            default : {
                this.aanmeldenView = "week";
                beginDatum = this.maandag;                              // maandag in de 1e week vande maand, kan in de vorige maand vallen
                eindDatum = this.maandag.plus({days: 6});       // 6 dagen later is zondag
                break;
            }
        }

        const params: KeyValueArray = {};
        this.daginfoService.getDagInfoDagen(false, beginDatum, eindDatum, undefined, params).then((di) => {
            if (volgnummer !== this.ophaalVolgnummer) return;
            this.dagInfo = di;
        })

        this.isLoadingRooster = true;
        this.isLoadingDiensten = true;
        this.isLoadingAanwezig = true;

        const roosterPromise = this.roosterService.getRooster(beginDatum, eindDatum).then((rooster) => {
            if (volgnummer === this.ophaalVolgnummer) {
                this.rooster = rooster;
                this.isLoadingRooster = false;
            }
            return rooster;
        });
        roosterPromise.catch(() => this.isLoadingRooster = false);

        // We hebben  diensten nodig.Startleider/instructeur mag lid status zien (en mail sturen)
        roosterPromise.then(() => this.dienstenService.getDiensten(beginDatum, eindDatum)).then((diensten) => {
            if (volgnummer !== this.ophaalVolgnummer) return;
            this.diensten = diensten;
            this.isLoadingDiensten = false;
        }).catch(() => this.isLoadingDiensten = false)

        // afmeldingen kunnen we pas toevoegen als zowel rooster als aanmeldingen geladen zijn
        Promise.all([roosterPromise, this.aanwezigLedenService.getAanwezig(beginDatum, eindDatum)])
            .then(async ([rooster, aanmeldingen]) => {
                const afmeldingen = await this.UitschrijvingenDDWV(rooster, beginDatum, eindDatum);
                if (volgnummer !== this.ophaalVolgnummer) return;

                this.aanmeldingen = [...aanmeldingen, ...afmeldingen];     // kopie, nooit de cache van de service aanpassen
                this.filter();  // filter de aanmeldingen op vliegveld
                this.isLoadingAanwezig = false;
            })
            .catch(() => this.isLoadingAanwezig = false)
    }

    private async UitschrijvingenDDWV(rooster: HeliosRoosterDataset[], beginDatum: DateTime, eindDatum: DateTime): Promise<HeliosAanwezigLedenDataset[]>
    {
        const ui = this.loginService.userInfo!;

        // alleen voor beheerders halen we de afmeldingen op
        if (!ui!.Userinfo?.isBeheerderDDWV && !ui!.Userinfo?.isBeheerder) {
            return [];
        }

        const afmeldingen = await this.aanwezigLedenService.getAanwezigVerwijderd(beginDatum, eindDatum);
        return afmeldingen.filter((afmelding) => {
            const dag = rooster.find(d => d.DATUM == afmelding.DATUM);
            // alleen geintreseerd in afmeldingen op DDWV dagen
            return dag !== undefined && (dag.DDWV || !(dag.CLUB_BEDRIJF || dag.WINTER_WERK));
        });
    }

    // We gaan naar een nieuwe datum
    protected zetDatum(nieuweDatum: DateTime) {
        this.datum = nieuweDatum;
        this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
        this.opvragen();
    }

    // Is de datum in het verleden
    protected verleden(datum: string | undefined) {
        if (!datum) {
            return false;
        }
        const d = DateTime.fromSQL(datum).plus({days: 1});
        return d < DateTime.now()
    }



    // Toon datum als dd-mm-yyyy
    protected datumDMY(dagDatum: string | undefined): string {
        if (!dagDatum) {
            return '';
        }
        const d = dagDatum.split('-');
        return d[2] + '-' + d[1] + '-' + d[0];
    }

    // toon popup dat de gebruiker zich wil afmelden voor de vliegdag
    protected afmeldenPopup(datum: string | undefined) {
        if (!datum) {
            return;
        }
        const d = datum.split('-');
        this.afmeldDatumDMY = d[2] + '-' + d[1] + '-' + d[0];
        this.afmeldDatum = DateTime.fromSQL(datum);

        this.bevestigAfmeldenPopup().open();
    }

    // afmelding doorvoeren bij Helios
    protected afmelden() {
        this.isLoadingAanwezig = true;
        this.aanwezigLedenService.getAanwezig(this.afmeldDatum, this.afmeldDatum).then((a) => {
            const aanmeldingen = a!.filter((al: HeliosAanwezigLedenDataset) => {
                return al.LID_ID == this.loginService.userInfo!.LidData!.ID
            })

            console.log(aanmeldingen)

            for (const item of aanmeldingen) {
                if (item.DATUM == DateTime.now().toISODate() && item.AANKOMST) {
                    this.aanwezigLedenService.afmelden(item.LID_ID!).then(() => this.opvragen());
                } else if (!item.VERWIJDERD) {
                    this.aanwezigLedenService.aanmeldingVerwijderen(item.ID!).then(() => this.opvragen())
                       .catch((e) => {this.error = e;});
                }
            }
            this.isLoadingAanwezig = false;
            this.bevestigAfmeldenPopup().close();
        }).catch((e) => {
            this.error = e;
            console.error (e);
            this.isLoadingAanwezig = false
        })
    }

    // openen van windows voor aanmelden vlieger
    protected aanmeldenLidScherm(datum: string | undefined) {
        if (!datum) {
            return;
        }
        const rooster = this.rooster.find((r) => r.DATUM == datum);

        const lidData = this.loginService.userInfo!.LidData!
        const aanmelding: HeliosAanwezigLedenDataset = {
            LID_ID: lidData.ID!,
            NAAM: lidData.NAAM!,
            DATUM: datum,
            VOORAANMELDING: true
        }

        if (rooster?.WINTER_WERK) {
            this.aanwezigLedenService.aanmelden(aanmelding).then(() => this.opvragen())
        }
        else {
            this.aanmeldEditor().openPopup(aanmelding);
        }

    }

    // open van editor voor aanmelden
    protected openLidAanwezigEditor(lidAanwezig: HeliosAanwezigLedenDataset) {
        this.aanmeldEditor().openPopup(lidAanwezig);
    }

    // hoe breed moeten de kolommen zijn in week view
    protected KolomBreedte(): string {
        return `width: calc(100%/${this.rooster.length});`;
    }

    // staf lid voor deze dag
    protected staf(dagDatum: string | undefined): boolean {
        if (!dagDatum) {
            return false;
        }
        const ui = this.loginService.userInfo;
        if (ui!.Userinfo!.isBeheerder || ui?.Userinfo!.isCIMT || ui!.Userinfo!.isInstructeur)
            return true;

        if (!this.diensten) {
            return false;
        }

        const diensten = this.diensten.filter((d) => {
            return (
                d.TYPE_DIENST_ID == 1800 ||     // 1800 = Ochtend DDI
                d.TYPE_DIENST_ID == 1800 ||     // 1800 = Ochtend Instructeur
                d.TYPE_DIENST_ID == 1805 ||     // 1809 = Middag DDI
                d.TYPE_DIENST_ID == 1806 ||     // 1809 = Middag Instructeur

                d.TYPE_DIENST_ID == 1804 ||     // 1804 = Ochtend startleider
                d.TYPE_DIENST_ID == 1809 ||     // 1809 = Middag startleider
                d.TYPE_DIENST_ID == 1811 ||     // 1811 = 2e ochtend startleider
                d.TYPE_DIENST_ID == 1812)       // 1812 = 2e middag startleider
        });

        // als de ingelode gebruiker, startleider is. Is hij/zij staf lid.
        const idx = diensten.findIndex((d) => {
            return (d.DATUM == dagDatum && d.LID_ID == ui!.LidData!.ID)
        });
        return idx >= 0;
    }

    protected aanwezigen(dagDatum: string | undefined): HeliosAanwezigLedenDataset[] {
        if (!this.filteredAanmeldingen || !dagDatum) {
            return [];
        }

        const aanwezig = this.filteredAanmeldingen.filter((a: HeliosAanwezigLedenDataset) => {
            return a.DATUM == dagDatum;
        });

        aanwezig.sort(function (a, b) {
            if (a.VERWIJDERD !== b.VERWIJDERD)
            {
                const av = a.VERWIJDERD ? 1 :0;
                const bv = b.VERWIJDERD ? 1 :0;

                return av-bv;
            }

            const posA = (a.STATUS_SORTEER_VOLGORDE) ? a.STATUS_SORTEER_VOLGORDE : 10000;
            const posB = (b.STATUS_SORTEER_VOLGORDE) ? b.STATUS_SORTEER_VOLGORDE : 10000;

            if (posA != posB) {
                return posB - posA;
            }
            return a.ID! - b.ID!;
        })
        return aanwezig ? aanwezig : []
    }

    protected isAangemeld(dagDatum: string | undefined): boolean {
        const ui = this.loginService.userInfo?.LidData;

        if (!this.aanmeldingen || !dagDatum) {
            return false;
        }

        // findIndex geeft -1 als het niet gevonden is
        // verwijderde aanmeldingen en leden die al vertrokken zijn tellen niet als aangemeld, zodat ze zich opnieuw kunnen aanmelden
        const aanwezig = this.aanmeldingen.findIndex((a: HeliosAanwezigLedenDataset) => {
            return (a.DATUM == dagDatum && a.LID_ID == ui?.ID && !a.VERWIJDERD && a.VERTREK == undefined);
        });

        return aanwezig >= 0;
    }

    protected magAanmelden(dagDatum: string | undefined): boolean {
        if (!dagDatum || this.isAangemeld(dagDatum)) {
            return false;
        }

        if (!this.rooster) {
            return false;
        }

        const ui = this.loginService.userInfo;
        const idx = this.rooster.findIndex((r: HeliosRoosterDataset) => r.DATUM == dagDatum);

        if (ui!.LidData!.STARTVERBOD) { // tja ....
            console.log(dagDatum, "start verbod");
            return false;
        }
        if (!this.rooster[idx].DDWV && !this.rooster[idx].CLUB_BEDRIJF && !this.rooster[idx].WINTER_WERK) {   // geen vliegdag, geen winterwerk
            console.log(dagDatum, "geen vliegdag");
            return false;
        }
        if (!this.rooster[idx].DDWV && ui!.LidData!.LIDTYPE_ID == 625) {    // 625 = DDWV vlieger
            console.log(dagDatum, "DDWV'er en geen DDWV dag");
            return false;
        }
        if (ui!.LidData!.LIDTYPE_ID == 625 && ui!.LidData!.ZUSTERCLUB_ID == undefined) {      // alleen aanmelden als je lid bent bij een zusterclub
            console.log(dagDatum, "DDWV'er en geen zusterclub");
            return false;
        }
        if (this.rooster[idx].WINTER_WERK)
        {
            if (ui!.LidData!.LIDTYPE_ID == 625)     // 625 = DDWV vlieger
            {
                console.log(dagDatum, "DDWV'er en winterwerk, dat past niet");
                return false;
            }
            return true;
        }
        if ((ui!.LidData?.LIDTYPE_ID == 625) && (!this.magAanmeldenDDWV)) // 625 = DDWV vlieger en geen toestemming
        {
            console.log(dagDatum, "DDWV vragenlijs is niet ingevuld, of geen DDWV toestemming");
            return false;
        }
        if (!this.rooster[idx].CLUB_BEDRIJF)    // welke lidtypes mogen aanmelden als we geen club bedrijf hebben
        {
            switch (ui!.LidData!.LIDTYPE_ID) {
                case 600: // student
                case 601: // erelid
                case 602: // lid
                case 603: // jeugdlid
                case 604: // private owner
                case 605: // veteraan
                case 606: // donateur
                {
                    if (!this.rooster[idx].CLUB_BEDRIJF && ui!.LidData!.STATUSTYPE_ID !== 1903) {  // 1903 = Brevethouder
                        console.log(dagDatum, "Geen clubdag, geen brevethouder");
                        return false;
                    }
                    break;
                }
                case 625: // DDWV'er
                {
                    break;
                }
                default:
                    console.log(dagDatum, "Lidtype mag niet aanmelden");
                    return false;          // andere lidtypes dus niet
            }


            if (!this.magAanmeldenDDWV)
            {
                console.log(dagDatum, "DDWV vragenlijs is niet ingevuld, of geen DDWV toestemming");
                return false;
            }
        }

        return true;
    }

    // Mogen we de dag tonen
    protected magTonen(dagDatum: string | undefined): boolean {
        if (!this.rooster || !dagDatum) {
            return false;
        }

        const ui = this.loginService.userInfo;
        const dag = this.rooster.find((r: HeliosRoosterDataset) => {
            return r.DATUM == dagDatum
        });

        if (!dag) {
            return false;
        }

        if (!dag.DDWV && ui?.LidData?.LIDTYPE_ID == 625) {    // 625 = DDWV vlieger
            return false;
        }
        return true;
    }

    protected naarDashboard(lidAanwezig: HeliosAanwezigLedenDataset): boolean {
        if (lidAanwezig.LIDTYPE_ID == 625) {   //  Geen dashboard link voor DDWV'ers
            return false;
        }
        if (lidAanwezig.LID_ID == this.loginService.userInfo?.LidData?.ID) {   //  Geen dashboard link voor ingelode gebruiker
            return false;
        }

        const ui = this.loginService.userInfo?.Userinfo;
        if (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur) {
            return true;
        }

        // DDWV beheerder mag alleen naar dashboard op een DDWV dag
        if (ui?.isBeheerderDDWV) {
            const roosterDag = this.rooster.find((r: HeliosRoosterDataset) => {
                return r.DATUM == lidAanwezig.DATUM
            });

            if (roosterDag && (roosterDag.DDWV)) {
                return true;
            }
        }
        return false;
    }

    protected toonBarometer(_: HeliosAanwezigLedenDataset) {
        const ui = this.loginService.userInfo?.Userinfo;
        if (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur) {
            return true;
        }
        return false
    }

    protected kleurBarometer(lid: HeliosAanwezigLedenDataset) {
        switch (lid.STATUS_BAROMETER) {
            case 'rood' :
                return 'barometer-rood';
            case 'geel' :
                return 'barometer-geel';
            case 'groen' :
                return 'barometer-groen';
        }
    }

    // toon de samenvatting van de dag
    protected samenvatting(rooster: HeliosRoosterDataset) {
        this.samenvattingPopup().openPopup(rooster)
    }

    // als we daginfo hebben, hoeven we niet meer te berekenen welke startmethode we gebruiken
    protected dagInfoDefaultStartMetode(datum: string | undefined) {
        if (!this.dagInfo || !datum) {
            return undefined;
        }

        const dagInfo = this.dagInfo.find((di: HeliosDagInfosDataset) => {
            return di.DATUM == datum && di.DDWV
        });

        return (dagInfo) ? dagInfo.STARTMETHODE_OMS : undefined
    }

    protected filter() {
        if (this.vliegveld) {
            this.filteredAanmeldingen = this.aanmeldingen.filter((s: HeliosAanwezigLedenDataset) => {
                return ((s.VELD_ID == this.vliegveld) || (s.VELD_ID == undefined))
            })
        }
        else {
            this.filteredAanmeldingen = this.aanmeldingen
        }
    }

    // stuur email naar iedereen die is aangemeld
    protected bulkEmail(dagDatum: string) {
        const aanwezig = this.aanmeldingen.filter((a: HeliosAanwezigLedenDataset) => {
            return a.DATUM == dagDatum;
        });

        const ui = this.loginService.userInfo?.LidData;
        const toEmail: string = ui!.EMAIL as string;
        let bcc = "";

        aanwezig.forEach((lid: HeliosAanwezigLedenDataset) => {
            if (lid.EMAIL?.includes('@')) {
                bcc += lid.EMAIL + ","
            }
        })

        window.location.href = `mailto:${toEmail}?bcc=${bcc}`;
    }

    // DATUM is optioneel in het type, zonder datum geeft NaN zodat zowel '< 0' als '>= 0' false zijn
    protected readonly DateDiff = (datum: string | undefined): number => datum ? DateDiff(datum) : NaN;

    protected TypeBedrijf(DATUM: string | undefined, dagInRooster: HeliosRoosterDataset): string {
        const tbc = this.TypeBedrijfClass(DATUM, dagInRooster)
        switch (tbc) {
            case "geenBedrijf": return "Onvoldoende aanmeldingen";
            case "sleepBedrijf": return "Sleep bedrijf";
            case "lierBedrijf": return "Lier bedrijf";
        }
        return tbc;
    }


    protected TypeBedrijfClass(DATUM: string | undefined, dagInRooster: HeliosRoosterDataset): string {
        if (this.aanmeldingen === undefined || !DATUM) {
            return "geenBedrijf";
        }

        const aanwezig = this.aanmeldingen.filter((a: HeliosAanwezigLedenDataset) => {
            return a.DATUM == DATUM && a.VERWIJDERD == false;
        });

        if (aanwezig.length < dagInRooster.MIN_SLEEPSTART! && aanwezig.length < dagInRooster.MIN_LIERSTART!) {
            return "geenBedrijf";
        }

        if (aanwezig.length >= dagInRooster.MIN_SLEEPSTART! && aanwezig.length < dagInRooster.MIN_LIERSTART!) {
            return "sleepBedrijf";
        }

        return "lierBedrijf";
    }
}

export default AanmeldenPageComponent;
