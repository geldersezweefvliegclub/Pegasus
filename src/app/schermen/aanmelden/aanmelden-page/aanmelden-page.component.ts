import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faChevronDown, faChevronUp, faInfoCircle, faStreetView} from "@fortawesome/free-solid-svg-icons";
import {Subscription} from "rxjs";
import {SchermGrootte, SharedService} from "../../../services/shared/shared.service";
import {getBeginEindDatumVanMaand} from "../../../utils/Utils";
import {DateTime} from "luxon";
import {
    HeliosAanwezigLedenDataset, HeliosDagInfosDataset, HeliosDienstenDataset,
    HeliosGast,
    HeliosGastenDataset, HeliosLid,
    HeliosRoosterDataset, HeliosType
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
import {TypesService} from "../../../services/apiservice/types.service";
import {DdwvService} from "../../../services/apiservice/ddwv.service";
import {LedenService} from "../../../services/apiservice/leden.service";
import {TransactiesComponent} from "../../../shared/components/transacties/transacties.component";
import {PegasusConfigService} from "../../../services/shared/pegasus-config.service";
import {DaginfoService} from "../../../services/apiservice/daginfo.service";
import {KeyValueArray} from "../../../types/Utils";
import {SamenvattingComponent} from "../samenvatting/samenvatting.component";

export type HeliosRoosterDatasetExtended = HeliosRoosterDataset & {
    EENHEDEN?: number
}

@Component({
    selector: 'app-aanmelden-page',
    templateUrl: './aanmelden-page.component.html',
    styleUrls: ['./aanmelden-page.component.scss']
})
export class AanmeldenPageComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private bevestigAfmeldenPopup: ModalComponent;
    @ViewChild(LidAanwezigEditorComponent) aanmeldEditor: LidAanwezigEditorComponent;
    @ViewChild(GastEditorComponent) gastEditor: GastEditorComponent;
    @ViewChild(SamenvattingComponent) samenvattingPopup: SamenvattingComponent;

    @ViewChild(TransactiesComponent) transactieScherm: TransactiesComponent;

    readonly aanmeldenIcon: IconDefinition = faStreetView;
    readonly infoIcon: IconDefinition = faInfoCircle;
    readonly iconDown: IconDefinition = faChevronDown;
    readonly iconUp: IconDefinition = faChevronUp;

    private aanwezigLedenAbonnement: Subscription;  // Wie zijn er op welke dag aanwezig
    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    datum: DateTime = DateTime.now();               // de gekozen dag
    maandag: DateTime                               // de eerste dag van de week

    lid: HeliosLid;                                 // nodig om te checken over nog voldoende DDWV tegoed is
    saldoTonen: boolean = false;

    private typesAbonnement: Subscription;
    ddwvTypes: HeliosType[];

    afmeldDatumDMY: string;                         // De datum waarop we ons afmelden
    afmeldDatum: DateTime;

    ophalenOverslaan = false;                       // Voorkom dat er te veel tegelijk wordt opgevraagd
    isLoadingRooster: boolean = false;
    isLoadingDiensten: boolean = false;
    isLoadingAanwezig: boolean = false;
    isLoadingGasten: boolean = false;

    aanmeldenView: string = "week";
    rooster: HeliosRoosterDatasetExtended[];        // rooster voor gekozen periode (dag/week/maand)
    diensten: HeliosDienstenDataset[];              // Wie hebben er dienst
    aanmeldingen: HeliosAanwezigLedenDataset[];     // De aanmeldingen
    gasten: HeliosGastenDataset[];                  // De gasten voor de vliegdag
    dagInfo: HeliosDagInfosDataset[];               // De bijhoorende dag info

    toonDatumKnoppen: boolean = false;              // Mag de gebruiker een andere datum kiezen
    toonGasten: boolean = false;
    isDDWVer: boolean = false;                      // DDWV'ers mogen geen club dagen zien
    ddwvActief: boolean = true;                     // Doen we aan een DDWV bedrijf

    constructor(private readonly ddwvService: DdwvService,
                private readonly typesService: TypesService,
                private readonly loginService: LoginService,
                private readonly ledenService: LedenService,
                private readonly sharedService: SharedService,
                private readonly gastenService: GastenService,
                private readonly roosterService: RoosterService,
                private readonly storageService: StorageService,
                private readonly daginfoService: DaginfoService,
                private readonly dienstenService: DienstenService,
                private readonly configService: PegasusConfigService,
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

        // abonneer op wijziging van transactie types
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.ddwvTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 20
            });
        });

        const toonGasten = this.storageService.ophalen("toonGasten")
        if (toonGasten != null) {
            this.toonGasten = toonGasten;
        }

        this.ddwvActief = this.ddwvService.actief();
        this.isDDWVer = this.loginService.userInfo?.Userinfo?.isDDWV!;

        const ui = this.loginService.userInfo?.Userinfo;
        this.saldoTonen = this.configService.saldoActief() && (ui!.isDDWV! || ui!.isClubVlieger!);
        this.toonDatumKnoppen = (ui!.isDDWV! || ui!.isClubVlieger!);
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    onWindowResize() {
        // als je geen datum mag aanpassen, zie alleen vandaag
        if (this.toonDatumKnoppen == false) {
            this.aanmeldenView = "dag"
        }
        else {
            if (this.sharedService.getSchermSize() <= SchermGrootte.sm) {
                this.aanmeldenView = "dag"
            } else {
                this.aanmeldenView = "week"
            }
        }
    }

    opvragen(): void {

        let beginDatum: DateTime;
        let eindDatum: DateTime;

        if (this.ophalenOverslaan) {    // tweede verzoek om data op te vragen binnen 2 seconden
            return;
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
                beginDatum = this.maandag;                              // maandag in de 1e week vande maand, kan in de vorige maand vallen
                eindDatum = this.maandag.plus({days: 6});       // 6 dagen later is zondag
                break;
            }
        }

        let params: KeyValueArray = {};
        params['VELDEN'] = "DATUM,DDWV,STARTMETHODE_OMS";
        this.daginfoService.getDagInfoDagen(false, beginDatum, eindDatum, undefined, params).then((di) => {
            this.dagInfo = di;
        })

        this.isLoadingRooster = true;
        this.isLoadingDiensten = true;
        this.roosterService.getRooster(beginDatum, eindDatum).then((rooster) => {
            this.rooster = rooster;
            this.isLoadingRooster = false;
            this.berekenStrippen();

            // We hebben startleider diensten nodig.Startleider mag lid status zien op
            this.dienstenService.getDiensten(beginDatum, eindDatum).then((diensten) => {
                this.diensten = diensten.filter((d) => {
                    return (
                        d.TYPE_DIENST_ID == 1804 ||
                        d.TYPE_DIENST_ID == 1809 ||
                        d.TYPE_DIENST_ID == 1811 ||
                        d.TYPE_DIENST_ID == 1812)
                });
                this.isLoadingDiensten = false;
            }).catch(() => this.isLoadingDiensten = false)
        }).catch(() => this.isLoadingRooster = false)

        this.isLoadingAanwezig = true;
        this.aanwezigLedenService.getAanwezig(beginDatum, eindDatum).then((aanmeldingen) => {
            this.aanmeldingen = aanmeldingen;
            this.isLoadingAanwezig = false;
            this.berekenStrippen();
        }).catch(() => this.isLoadingAanwezig = false)

        this.isLoadingGasten = true;
        this.gastenService.getGasten(false, beginDatum, eindDatum).then((gasten) => {
            this.gasten = gasten;
            this.isLoadingGasten = false;
        }).catch(() => this.isLoadingGasten = false)

        // lid informatie hebben we alleen nodig als we ddwv kunnen aanmelden
        // Het tegoed moet dan beschikbaar zijn
        if (this.ddwvService.actief()) {
            this.opvragenLid();
        }
    }

    opvragenLid() {
        const ui = this.loginService.userInfo?.LidData;
        this.ledenService.getLid(ui!.ID!).then((lid: HeliosLid) => {
            this.lid = lid;
        });
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

    berekenStrippen() {
        if (this.isLoadingRooster || this.isLoadingAanwezig) {
            for (let i = 0; i < this.rooster.length; i++) {
                this.rooster[i].EENHEDEN = -1;
            }
        } else {
            for (let i = 0; i < this.rooster.length; i++) {
                this.rooster[i].EENHEDEN = this.dagStrip(this.rooster[i].DATUM!);
            }
        }
    }

    dagStrip(datum: string): number {
        const d = DateTime.fromSQL(datum);
        const clubVlieger = this.loginService.userInfo?.Userinfo?.isClubVlieger;    // is DDWVer

        if (!this.ddwvService.actief()) return -1; // als er geen DDWV bedrijf is, hebben we niets met strippen te maken

        if (this.isAangemeld(datum)) {  // als we al aangemeld zijn, zijn strippen niet meer relevant
            return -1
        }
        const roosterDag = this.rooster.find((r: HeliosRoosterDataset) => {
            return r.DATUM == datum
        });

        if (!roosterDag) return -1;
        if (!roosterDag.DDWV) return -1;
        if (roosterDag.CLUB_BEDRIJF && clubVlieger) return -1;

        const typeID = this.ddwvService.getTransactieTypeID(d);
        const transactie = this.ddwvTypes.find((t: HeliosType) => {
            return t.ID == typeID
        });

        if (!transactie) return -1;
        return Math.abs(transactie.EENHEDEN!)
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
        console.log("eeee")
        this.isLoadingAanwezig = true;
        this.aanwezigLedenService.getAanwezig(this.afmeldDatum, this.afmeldDatum).then((a) => {
            const aanmeldingen = a!.filter((al: HeliosAanwezigLedenDataset) => {
                return al.LID_ID == this.loginService.userInfo!.LidData!.ID
            })

            for (let i = 0; i < aanmeldingen.length; i++) {
                if (aanmeldingen[i].DATUM == DateTime.now().toISODate() && aanmeldingen[i].AANKOMST) {
                    this.aanwezigLedenService.afmelden(aanmeldingen[i].LID_ID!).then(() => this.opvragen());
                } else {
                    this.aanwezigLedenService.aanmeldingVerwijderen(aanmeldingen[i].ID!).then(() => this.opvragen());
                }
            }
            this.isLoadingAanwezig = false;
            this.bevestigAfmeldenPopup.close();
        }).catch(() => this.isLoadingAanwezig = false)
    }

    // openen van windows voor aanmelden vlieger
    aanmeldenLidScherm(datum: string) {
        const rooster = this.rooster.find((r) => r.DATUM == datum);
        const strippen = (this.ddwvService.actief() && rooster && rooster.EENHEDEN! > 0) ? rooster.EENHEDEN : undefined;

        const lidData = this.loginService.userInfo!.LidData!
        const aanmelding: HeliosAanwezigLedenDataset = {
            LID_ID: lidData.ID!,
            NAAM: lidData.NAAM!,
            DATUM: datum,
            VOORAANMELDING: true
        }
        this.aanmeldEditor.openPopup(aanmelding, strippen);
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
        const idx = this.diensten.findIndex((d) => {
            return (d.DATUM == dagDatum && d.LID_ID == ui!.LidData!.ID)
        });
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
        const idx = this.rooster.findIndex((r: HeliosRoosterDataset) => r.DATUM == dagDatum);

        if (ui!.LidData!.STARTVERBOD) { // tja ....
            console.log(dagDatum, "start verbod");
            return false;
        }
        if (!this.rooster[idx].DDWV && !this.rooster[idx].CLUB_BEDRIJF) {   // geen vliegdag
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
        if (!this.rooster[idx].CLUB_BEDRIJF)    // welke lidtypes mogen aanmelden als we geen club bedrijf hebben
        {
            switch (ui!.LidData!.LIDTYPE_ID) {
                case 601: // ere lid
                case 602: // lid
                case 603: // jeugdlid
                case 604: // private owner
                case 605: // veteraan
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
        }

        // Bij een DDWV bedrijf moeten we ook naar het tegoed van de vlieger kijken
        if (this.ddwvService.actief()) {
            if (!this.lid) { // we weten niet hoeveel saldo het lid heeft om dat lid data onbekend is
                console.log(dagDatum, "lid onbekend");
                return false;
            }

            if (!this.rooster[idx].CLUB_BEDRIJF) {
                if ((this.rooster[idx].EENHEDEN! > 0) && (this.rooster[idx].EENHEDEN! > this.lid.TEGOED!)) {
                    console.log(dagDatum, "onvoldoende saldo");
                    return false;
                }
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
        if (ui?.isBeheerder || ui?.isCIMT || ui?.isInstructeur)  {
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

    kleurBarometer(lid: HeliosAanwezigLedenDataset) {
        switch (lid.STATUS_BAROMETER) {
            case 'rood' :
                return 'barometer-rood';
            case 'geel' :
                return 'barometer-geel';
            case 'groen' :
                return 'barometer-groen';
        }
    }

    // openen van windows voor het tonen van de transacties
    toonTransacties() {
        this.transactieScherm.openPopup(this.lid!.ID!, this.ddwvService.magBestellen(this.lid.TEGOED));
    }

    // toon de samenvatting van de dag
    samenvatting(datum: string) {
        this.samenvattingPopup.openPopup(datum)
    }

    // als we daginfo hebben, hoeven we niet meer te berekenen welke startmethode we gebruiken
    dagInfoDefaultStartMetode(datum: string) {
        if (!this.dagInfo) {
            return undefined;
        }

        const dagInfo = this.dagInfo.find((di: HeliosDagInfosDataset) => {
            return di.DATUM == datum && di.DDWV
        });

        return (dagInfo) ? dagInfo.STARTMETHODE_OMS : undefined
    }
}
