import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {
    HeliosAanwezigLedenDataset,
    HeliosCompetentiesDataset,
    HeliosRoosterDataset,
    HeliosType
} from "../../../types/Helios";
import {DagVanDeWeek, getBeginEindDatumVanMaand} from "../../../utils/Utils";
import {DateTime} from "luxon";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {AanwezigLedenService} from "../../../services/apiservice/aanwezig-leden.service";
import {DatumRenderComponent} from "../../../shared/components/datatable/datum-render/datum-render.component";
import {LoginService} from "../../../services/apiservice/login.service";
import {Subscription} from "rxjs";

@Component({
    selector: 'app-aanmelden-weekview',
    templateUrl: './aanmelden-weekview.component.html',
    styleUrls: ['./aanmelden-weekview.component.scss']
})
export class AanmeldenWeekviewComponent implements OnChanges {
    @Input() rooster: HeliosRoosterDataset[];
    @Input() aanmeldingen: HeliosAanwezigLedenDataset[];
    @Input() datum: DateTime;

    @Output() nieuweDatum: EventEmitter<DateTime> = new EventEmitter<DateTime>();
    @Output() afmelden: EventEmitter<DateTime> = new EventEmitter<DateTime>();
    @Output() aanmelden: EventEmitter<DateTime> = new EventEmitter<DateTime>();

    private aanwezigLedenAbonnement: Subscription;

    isLoading: boolean;
    maandag: DateTime;                          // De maandag van de gekozen week

    constructor(private readonly loginService: LoginService) {
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

    KolomBreedte():string {
        return `width: calc(100%/${this.rooster.length});`;
    }

    // Is de datum in het verleden
    verleden(datum: string)  {
        const d = DateTime.fromSQL(datum).plus({days:1});
        return d < DateTime.now()
    }

    aanwezigen(dagDatum: string): HeliosAanwezigLedenDataset[] {
        if (!this.aanmeldingen) {
            return [];
        }

        const aanwezig = this.aanmeldingen.filter((a: HeliosAanwezigLedenDataset) => {
            return a.DATUM == dagDatum;
        });

        return aanwezig ? aanwezig : []
    }

    isAangemeld(dagDatum: string): boolean{
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
        const idx = this.rooster.findIndex((r: HeliosRoosterDataset) => { return r.DATUM == dagDatum });

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
            switch (ui!.LidData!.LIDTYPE_ID)
            {
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
                default: return false;          // andere lidtypes dus niet
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
        const idx = this.rooster.findIndex((r: HeliosRoosterDataset) => { return r.DATUM == dagDatum });

        if (!this.rooster[idx].DDWV && ui!.LidData!.LIDTYPE_ID == 625) {    // 625 = DDWV vlieger
            return false;
        }
        return true;
    }

    // Het afmelden is geimplementeerd in de parent class
    Afmelden(DATUM: any) {
        this.afmelden.emit(DATUM)
    }

    // Het afmelden is geimplementeerd in de parent class
    Aanmelden(DATUM: any) {
        this.aanmelden.emit(DATUM)
    }
}
