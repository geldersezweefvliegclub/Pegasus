import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {
    HeliosAanwezigLedenDataset, HeliosDienstenDataset,
    HeliosGastenDataset,
    HeliosRoosterDataset,
} from "../../../types/Helios";
import {DagVanDeWeek} from "../../../utils/Utils";
import {DateTime} from "luxon";
import {LoginService} from "../../../services/apiservice/login.service";
import {IconDefinition} from "@fortawesome/free-regular-svg-icons";
import {faChevronDown, faChevronUp} from "@fortawesome/free-solid-svg-icons";
import {StorageService} from "../../../services/storage/storage.service";

class HeliosGastDataset {
}

@Component({
    selector: 'app-aanmelden-weekview',
    templateUrl: './aanmelden-weekview.component.html',
    styleUrls: ['./aanmelden-weekview.component.scss']
})
export class AanmeldenWeekviewComponent implements OnInit, OnChanges {
    @Input() rooster: HeliosRoosterDataset[];
    @Input() aanmeldingen: HeliosAanwezigLedenDataset[];
    @Input() gasten: HeliosGastenDataset[];
    @Input() diensten: HeliosDienstenDataset[];
    @Input() datum: DateTime;

    @Output() nieuweDatum: EventEmitter<DateTime> = new EventEmitter<DateTime>();
    @Output() afmelden: EventEmitter<DateTime> = new EventEmitter<DateTime>();
    @Output() aanmelden: EventEmitter<DateTime> = new EventEmitter<DateTime>();
    @Output() edit: EventEmitter<HeliosAanwezigLedenDataset> = new EventEmitter<HeliosAanwezigLedenDataset>();
    @Output() aanmeldenGast: EventEmitter<DateTime> = new EventEmitter<DateTime>();
    @Output() editGast: EventEmitter<HeliosGastDataset> = new EventEmitter<HeliosGastDataset>();

    iconDown: IconDefinition = faChevronDown;
    iconUp: IconDefinition = faChevronUp;

    toonGasten: boolean = false;
    isLoading: boolean;
    maandag: DateTime;                          // De maandag van de gekozen week

    constructor(private readonly storageService: StorageService,
                private readonly loginService: LoginService) {
    }

    ngOnInit() {
        const toonGasten = this.storageService.ophalen("toonGasten")
        if (toonGasten != null) {
            this.toonGasten = toonGasten;
        }

        const ui = this.loginService.userInfo?.Userinfo;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("datum")) {
            this.maandag = this.datum.startOf('week');     // de eerste dag van de gekozen week
        }
    }

    // Dit is al geimplementeerd in util.ts
    DagVanDeWeek(Datum: string) {
        return DagVanDeWeek(Datum);
    }

    // laat parent weten dat we een nieuwe week willen zien. Parent laadt de starts
    zetDatum(nieuweDatum: DateTime) {
        this.nieuweDatum.emit(nieuweDatum)
    }

    datumDMY(dagDatum: string): string {
        const d = dagDatum.split('-');
        return d[2] + '-' + d[1] + '-' + d[0];
    }

    KolomBreedte(): string {
        return `width: calc(100%/${this.rooster.length});`;
    }

    // Is de datum in het verleden
    verleden(datum: string) {
        const d = DateTime.fromSQL(datum).plus({days: 1});
        return d < DateTime.now()
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

    // Het afmelden is geimplementeerd in de parent class
    Afmelden(DATUM: any) {
        this.afmelden.emit(DATUM)
    }

    // Het aanmelden is geimplementeerd in de parent class
    Aanmelden(DATUM: any) {
        this.aanmelden.emit(DATUM)
    }

    // Het editen is geimplementeerd in de parent class
    Edit(lidAanwezig: HeliosAanwezigLedenDataset) {
        this.edit.emit(lidAanwezig)
    }

    // Het aanmelden is geimplementeerd in de parent class
    AanmeldenGast(DATUM: any) {
        this.aanmeldenGast.emit(DATUM)
    }

    // Het editen is geimplementeerd in de parent class
    EditGast(gastAanwezig: HeliosGastenDataset) {
        this.editGast.emit(gastAanwezig)
    }

    // Moeten we de gastenlijst tonen
    toonGastenWelNiet() {
        this.toonGasten = !this.toonGasten;
        this.storageService.opslaan("toonGasten", this.toonGasten, 24 * 7);   // 7 dagen
    }
}
