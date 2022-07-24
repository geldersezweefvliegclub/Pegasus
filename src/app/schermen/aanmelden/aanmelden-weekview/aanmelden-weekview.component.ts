import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {HeliosAanwezigLedenDataset, HeliosRoosterDataset, HeliosType} from "../../../types/Helios";
import {DagVanDeWeek, getBeginEindDatumVanMaand} from "../../../utils/Utils";
import {DateTime} from "luxon";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {AanwezigLedenService} from "../../../services/apiservice/aanwezig-leden.service";
import {DatumRenderComponent} from "../../../shared/components/datatable/datum-render/datum-render.component";
import {LoginService} from "../../../services/apiservice/login.service";

@Component({
    selector: 'app-aanmelden-weekview',
    templateUrl: './aanmelden-weekview.component.html',
    styleUrls: ['./aanmelden-weekview.component.scss']
})
export class AanmeldenWeekviewComponent implements OnInit, OnChanges {
    @Input() rooster: HeliosRoosterDataset[];
    @Input() datum: DateTime;

    @Output() nieuweDatum: EventEmitter<DateTime> = new EventEmitter<DateTime>();

    isLoading: boolean;
    maandag: DateTime;                          // De maandag van de gekozen week
    aanmeldingen: HeliosAanwezigLedenDataset[];

    constructor(private readonly loginService: LoginService,
                private readonly aanwezigService: AanwezigLedenService) {
    }

    ngOnInit(): void {

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty("datum")) {
            this.maandag = this.datum.startOf('week');     // de eerste dag van de gekozen week
            this.opvragen();
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

    // Opvragen van de aanmeldingen
    private opvragen(): void {
        let beginDatum: DateTime = this.maandag;
        let eindDatum: DateTime = this.maandag.plus({day:6})

        this.isLoading = true;
        this.aanwezigService.getAanwezig(beginDatum, eindDatum).then((aanmeldingen) => {
            this.aanmeldingen = aanmeldingen;
            console.log(aanmeldingen)
            this.isLoading = false;
        }).catch(() => this.isLoading = false)
    }

    aanwezigen(dagDatum: string): HeliosAanwezigLedenDataset[] {
        const aanwezig = this.aanmeldingen.filter((a: HeliosAanwezigLedenDataset) => {
            return a.DATUM == dagDatum;
        });

        return aanwezig ? aanwezig : []
    }

    isAangemeld(dagDatum: string): boolean{
        const ui = this.loginService.userInfo?.LidData!;

        const aanwezig = this.aanmeldingen.findIndex((a: HeliosAanwezigLedenDataset) => {
            return (a.DATUM == dagDatum && a.LID_ID == ui.ID);
        });

        return aanwezig < 0 ? false : true;
    }
}
