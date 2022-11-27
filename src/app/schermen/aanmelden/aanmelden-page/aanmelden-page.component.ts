import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faChevronDown, faChevronUp, faStreetView} from "@fortawesome/free-solid-svg-icons";
import {Subscription} from "rxjs";
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {getBeginEindDatumVanMaand} from "../../../utils/Utils";
import {DateTime} from "luxon";
import {
    HeliosAanwezigLedenDataset, HeliosDienstenDataset,
    HeliosGast,
    HeliosGastenDataset,
    HeliosRoosterDataset
} from "../../../types/Helios";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {ModalComponent} from "../../../shared/components/modal/modal.component";
import {LidAanwezigEditorComponent} from "../../../shared/components/editors/lid-aanwezig-editor/lid-aanwezig-editor.component";
import {LoginService} from "../../../services/apiservice/login.service";
import {AanwezigLedenService} from "../../../services/apiservice/aanwezig-leden.service";
import {GastenService} from "../../../services/apiservice/gasten.service";
import {GastEditorComponent} from "../../../shared/components/editors/gast-editor/gast-editor.component";
import {DienstenService} from "../../../services/apiservice/diensten.service";
import {StorageService} from "../../../services/storage/storage.service";
import {DagVanDeWeek} from "../../../utils/Utils";

@Component({
    selector: 'app-aanmelden-page',
    templateUrl: './aanmelden-page.component.html',
    styleUrls: ['./aanmelden-page.component.scss']
})
export class AanmeldenPageComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private bevestigAfmeldenPopup: ModalComponent;
    @ViewChild(LidAanwezigEditorComponent) aanmeldEditor: LidAanwezigEditorComponent;
    @ViewChild(GastEditorComponent) gastEditor: GastEditorComponent;

    readonly aanmeldenIcon: IconDefinition = faStreetView;

    private aanwezigLedenAbonnement: Subscription;  // Wie zijn er op welke dag aanwezig
    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    datum: DateTime = DateTime.now();               // de gekozen dag
    maandag: DateTime                               // de eerste dag van de week

    afmeldDatumDMY: string;                         // De datum waarop we ons afmelden
    afmeldDatum: DateTime;

    ophalenOverslaan = false;                       // Voorkom dat er te veel tegelijk wordt opgevraagd
    isLoading: boolean = false;
    aanmeldenView: string = "week";
    rooster: HeliosRoosterDataset[];                // rooster voor gekozen periode (dag/week/maand)
    diensten: HeliosDienstenDataset[];              // Wie hebben er dienst
    aanmeldingen: HeliosAanwezigLedenDataset[];     // De aanmeldingen
    gasten: HeliosGastenDataset[];                  // De gasten voor de vliegdag

    iconDown: IconDefinition = faChevronDown;
    iconUp: IconDefinition = faChevronUp;

    toonGasten: boolean = false;
    isDDWVer: boolean = false;                      // DDWV'ers mogen geen club dagen zien

    constructor(private readonly sharedService: SharedService,
                private readonly loginService: LoginService,
                private readonly gastenService: GastenService,
                private readonly roosterService: RoosterService,
                private readonly storageService: StorageService,
                private readonly dienstenService: DienstenService,
                private readonly aanwezigLedenService: AanwezigLedenService) {
    }

    ngOnInit(): void {
        this.onWindowResize();          // bepaal wat we moeten tonen dag/week/maand

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.zetDatum(DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1,
                }));
                this.opvragen();
            }
        })

        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.zetDatum(DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day,
            }))
            this.opvragen();
        });

        // abonneer op wijziging van aanwezige leden
        this.aanwezigLedenAbonnement = this.aanwezigLedenService.aanwezigChange.subscribe(dataset => {
            this.opvragen();    // kunnen dataset niet gebruiken omdat we hier ander tijdspanne gebruiken
        });

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize();
            this.opvragen();
        });

        const toonGasten = this.storageService.ophalen("toonGasten")
        if (toonGasten != null) {
            this.toonGasten = toonGasten;
        }

        this.isDDWVer = this.loginService.userInfo?.Userinfo?.isDDWV!;
    }

    ngOnDestroy(): void {
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    onWindowResize() {
        if (this.sharedService.getSchermSize() <= SchermGrootte.sm) {
            this.aanmeldenView = "dag"
        } else {
            this.aanmeldenView = "week"
        }
    }

    opvragen(): void {
        const beginEindDatum = getBeginEindDatumVanMaand(this.datum.month, this.datum.year);

        let beginDatum: DateTime = beginEindDatum.begindatum;
        let eindDatum: DateTime = beginEindDatum.einddatum;

        if (this.ophalenOverslaan) {
            return;                         // twee verzoek om data op t evragen binnen 2 seconden
        }

        this.ophalenOverslaan = true;
        setTimeout(() => this.ophalenOverslaan = false, 2000);

        switch (this.aanmeldenView) {
            case "dag" : {
                beginDatum = this.datum;
                eindDatum = this.datum;
                break;
            }
            case "week":
            default : {
                this.aanmeldenView = "week";
                beginDatum = this.datum.startOf('week');     // maandag in de 1e week vande maand, kan in de vorige maand vallen
                eindDatum = this.datum.endOf('week');        // zondag van de laaste week, kan in de volgende maand vallen
                break;
            }
        }

        this.isLoading = true;
        this.roosterService.getRooster(beginDatum, eindDatum).then((rooster) => {
            this.rooster = rooster;

            // We hebben startleider diensten nodig.Startleider mag lid status zien op
            this.dienstenService.getDiensten(beginDatum, eindDatum).then((diensten) => {
                this.diensten = diensten.filter((d) => {
                    return (
                        d.TYPE_DIENST_ID == 1804 ||
                        d.TYPE_DIENST_ID == 1809 ||
                        d.TYPE_DIENST_ID == 1811 ||
                        d.TYPE_DIENST_ID == 1812)
                });
                this.isLoading = false;
            }).catch(() => this.isLoading = false)
        }).catch(() => this.isLoading = false)

        this.aanwezigLedenService.getAanwezig(beginDatum, eindDatum).then((aanmeldingen) => {
            this.aanmeldingen = aanmeldingen;
            this.isLoading = false;
        }).catch(() => this.isLoading = false)

        this.gastenService.getGasten(false, beginDatum, eindDatum).then((gasten) => {
            this.gasten = gasten;
        }).catch(() => this.isLoading = false)
    }

    // We gaan naar een nieuwe datum
    zetDatum(nieuweDatum: DateTime) {
        this.datum = nieuweDatum;
        this.maandag = this.datum.startOf('week'); // de eerste dag van de gekozen week
        this.opvragen();
    }

    // Is de datum in het verleden
    verleden(datum: string) {
        const d = DateTime.fromSQL(datum).plus({days: 1});
        return d < DateTime.now()
    }

    // Dit is al geimplementeerd in util.ts
    DagVanDeWeek(Datum: string) {
        return DagVanDeWeek(Datum);
    }

    // Toon datum als dd-mm-yyyy
    datumDMY(dagDatum: string): string {
        const d = dagDatum.split('-');
        return d[2] + '-' + d[1] + '-' + d[0];
    }

    // toon popup dat de gebruiker zich wil afmelden voor de vliegdag
    afmeldenPopup(datum: string) {
        const d = datum.split('-');
        this.afmeldDatumDMY = d[2] + '-' + d[1] + '-' + d[0];
        this.afmeldDatum = DateTime.fromSQL(datum);

        this.bevestigAfmeldenPopup.open();
    }

    // afmelding doorvoeren bij Helios
    afmelden() {
        this.aanwezigLedenService.getAanwezig(this.afmeldDatum, this.afmeldDatum).then((a) => {
            const aanmeldingen = a!.filter((al:HeliosAanwezigLedenDataset) => { return al.LID_ID == this.loginService.userInfo!.LidData!.ID})

            for (let i=0 ; i < aanmeldingen.length ; i++)  {
                if (aanmeldingen[i].DATUM == DateTime.now().toISODate()  && aanmeldingen[i].AANKOMST) {
                    this.aanwezigLedenService.afmelden(aanmeldingen[i].LID_ID!).then(() => this.opvragen());
                }
                else {
                    this.aanwezigLedenService.aanmeldingVerwijderen(aanmeldingen[i].ID!).then(() => this.opvragen());
                }
            }
            this.isLoading = false;
            this.bevestigAfmeldenPopup.close();
        }).catch(() => this.isLoading = false)
    }

    // openen van windows voor aanmelden vlieger
    aanmeldenLidScherm(datum: string) {
        const lidData = this.loginService.userInfo!.LidData!
        const aanmelding: HeliosAanwezigLedenDataset = {
            LID_ID: lidData.ID!,
            NAAM: lidData.NAAM!,
            DATUM: datum,
            VOORAANMELDING: true
        }
        this.aanmeldEditor.openPopup(aanmelding);
    }

    // open van editor voor aanmelden
    openLidAanwezigEditor(lidAanwezig: HeliosAanwezigLedenDataset) {
        this.aanmeldEditor.openPopup(lidAanwezig);
    }

    // openen van windows voor aanmelden gast
    aanmeldenGastScherm(datum: string) {
        const aanmelding: HeliosGast = {
            DATUM: datum
        }
        this.gastEditor.openPopup(aanmelding);
    }

    // open van editor voor aanmelden van een gast
    openGastAanwezigEditor(gast: HeliosGastenDataset) {
        this.gastEditor.openPopup(gast);
    }

    // hoe breed moeten de kolommen zijn in week view
    KolomBreedte(): string {
        return `width: calc(100%/${this.rooster.length});`;
    }

    // staf lid voor deze dag
    staf(dagDatum: string): boolean {
        const ui = this.loginService.userInfo;
        if (ui!.Userinfo!.isBeheerder || ui?.Userinfo!.isCIMT || ui!.Userinfo!.isInstructeur)
            return true;

        if (!this.diensten) {
            return false;
        }
        // als de ingelode gebruiker, startleider is. Is hij/zij staf lid.
        const idx = this.diensten.findIndex((d) => { return (d.DATUM == dagDatum && d.LID_ID == ui!.LidData!.ID) });
        return idx >= 0;
    }

    aanwezigen(dagDatum: string): HeliosAanwezigLedenDataset[] {
        if (!this.aanmeldingen) {
            return [];
        }

        const aanwezig = this.aanmeldingen.filter((a: HeliosAanwezigLedenDataset) => {
            return a.DATUM == dagDatum;
        });

        // Voor staf sorteren we op vlieg status
        if (this.staf(dagDatum)) {
            aanwezig.sort(function (a, b) {
                const posA = (a.STATUS_SORTEER_VOLGORDE) ? a.STATUS_SORTEER_VOLGORDE : 10000;
                const posB = (b.STATUS_SORTEER_VOLGORDE) ? b.STATUS_SORTEER_VOLGORDE : 10000;

                if (posA != posB) {
                    return posB - posA;
                }
                return a.ID! - b.ID!;
            })
        }

        return aanwezig ? aanwezig : []
    }

    gastenAanwezig(dagDatum: string): HeliosGastenDataset[] {
        if (!this.gasten) {
            return [];
        }

        const gasten = this.gasten.filter((a: HeliosGastenDataset) => {
            return a.DATUM == dagDatum;
        });

        return gasten ? gasten : []
    }

    isAangemeld(dagDatum: string): boolean {
        const ui = this.loginService.userInfo?.LidData!;

        if (!this.aanmeldingen) {
            return false;
        }

        const aanwezig = this.aanmeldingen.findIndex((a: HeliosAanwezigLedenDataset) => {
            return (a.DATUM == dagDatum && a.LID_ID == ui.ID);
        });

        return aanwezig < 0 ? false : true;
    }

    magAanmelden(dagDatum: string): boolean {
        if (this.isAangemeld(dagDatum)) {
            return false;
        }

        if (!this.rooster) {
            return false;
        }

        const ui = this.loginService.userInfo;
        const idx = this.rooster.findIndex((r: HeliosRoosterDataset) => {
            return r.DATUM == dagDatum
        });

        if (ui!.LidData!.STARTVERBOD) { // tja ....
            return false;
        }
        if (!this.rooster[idx].DDWV && !this.rooster[idx].CLUB_BEDRIJF) {   // geen vliegdag
            return false;
        }
        if (!this.rooster[idx].DDWV && ui!.LidData!.LIDTYPE_ID == 625) {    // 625 = DDWV vlieger
            return false;
        }
        if (!this.rooster[idx].CLUB_BEDRIJF)    // welke lidtypes mogen aanmelden als we geen club bedrijf hebben
        {
            switch (ui!.LidData!.LIDTYPE_ID) {
                case 601: // ere lid
                case 602: // lid
                case 603: // jeugdlid
                {
                    if (!this.rooster[idx].CLUB_BEDRIJF && ui!.LidData!.STATUSTYPE_ID !== 1903) {  // 1903 = Brevethouder
                        return false;
                    }
                    break;
                }
                case 625: // DDWV'er
                {
                    break;
                }
                default:
                    return false;          // andere lidtypes dus niet
            }
        }
        return true;
    }

    // Mogen we de dag tonen
    magTonen(dagDatum: string): boolean {
        if (!this.rooster) {
            return false;
        }

        const ui = this.loginService.userInfo;
        const idx = this.rooster.findIndex((r: HeliosRoosterDataset) => {
            return r.DATUM == dagDatum
        });

        if (!this.rooster[idx].DDWV && ui!.LidData!.LIDTYPE_ID == 625) {    // 625 = DDWV vlieger
            return false;
        }
        return true;
    }

    // Moeten we de gastenlijst tonen
    toonGastenWelNiet() {
        this.toonGasten = !this.toonGasten;
        this.storageService.opslaan("toonGasten", this.toonGasten, 24 * 7);   // 7 dagen
    }

    naarDashboard(lidAanwezig: HeliosAanwezigLedenDataset): boolean {
        if (lidAanwezig.LIDTYPE_ID == 625) {   //  Geen dashboard link voor DDWV'ers
            return false;
        }
        if (lidAanwezig.LID_ID == this.loginService.userInfo?.LidData?.ID) {   //  Geen dashboard link voor ingelode gebruiker
            return false;
        }
        const ui = this.loginService.userInfo?.Userinfo;
        return (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur) as boolean;
    }

    kleurBarometer(lid: HeliosAanwezigLedenDataset) {
        switch (lid.STATUS_BAROMETER) {
            case 'rood' : return 'barometer-rood';
            case 'geel' : return 'barometer-geel';
            case 'groen' : return 'barometer-groen';
        }

    }
}
