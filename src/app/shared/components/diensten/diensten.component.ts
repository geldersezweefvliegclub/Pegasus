import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {DienstenService} from "../../../services/apiservice/diensten.service";
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {SharedService} from "../../../services/shared/shared.service";
import {HeliosDienstenDataset} from "../../../types/Helios";
import {DagRoosterComponent} from "../dag-rooster/dag-rooster.component";
import {ErrorMessage, SuccessMessage} from "../../../types/Utils";
import {LoginService} from "../../../services/apiservice/login.service";

@Component({
    selector: 'app-diensten',
    templateUrl: './diensten.component.html',
    styleUrls: ['./diensten.component.scss']
})
export class DienstenComponent implements OnInit, OnChanges {
    @Input() VliegerID: number;
    @Input() UitgebreideWeergave: boolean = false;

    @ViewChild(DagRoosterComponent) popup: DagRoosterComponent;

    private datumAbonnement: Subscription;  // volg de keuze van de kalender
    datum: DateTime = DateTime.now();       // de gekozen dag

    diensten: HeliosDienstenDataset[];
    roosterDatum: DateTime;
    isLoading: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    constructor(private readonly dienstenService: DienstenService,
                private readonly loginService: LoginService,
                private readonly sharedService: SharedService) {
    }

    ngOnInit(): void {
        // de datum zoals die in de kalender gekozen is
        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
            this.ophalen();
        })
    }

    ngOnChanges(changes: SimpleChanges) {
        this.ophalen()
    }

    ophalen(): void {
        // starttoren heeft geen data nodig
        if (this.loginService.userInfo?.Userinfo!.isStarttoren) {
            return;
        }

        if (this.datum) {
            let startMaand: number = this.datum.month; // laat alles vanaf gekozen maand zien
            let startDag: number = this.datum.day; // laat alles vanaf gekozen maand zien

            if ((this.UitgebreideWeergave) || (DateTime.now().year != this.datum.year)) {   // maar niet altijd
                startMaand = 1;
                startDag = 1;
            }

            const startDatum: DateTime = DateTime.fromObject({
                year: this.datum.year,
                month: startMaand,
                day: startDag
            })

            const eindDatum: DateTime = DateTime.fromObject({
                year: this.datum.year,
                month: 12,
                day: 31
            })

            this.isLoading = true;
            this.dienstenService.getDiensten(startDatum, eindDatum, undefined, this.VliegerID).then((d) => {
                this.isLoading = false;
                if ((this.UitgebreideWeergave) || d.length < 5) {
                    this.diensten = d;
                } else {
                    this.diensten = d.slice(0, 7);
                }
            }).catch(e => {
                this.error = e;
                this.isLoading = false;
            });
        }
    }

    toonDatum(datum: string): string {
        const d:DateTime = DateTime.fromSQL(datum)
        let retValue: string = d.day + " ";

        switch (d.month) {
            case 1: retValue += "Jan"; break;
            case 2: retValue += "Feb"; break;
            case 3: retValue += "Mrt"; break;
            case 4: retValue += "Apr"; break;
            case 5: retValue += "Mei"; break;
            case 6: retValue += "Juni"; break;
            case 7: retValue += "Juli"; break;
            case 8: retValue += "Aug"; break;
            case 9: retValue += "Sept"; break;
            case 10: retValue += "Okt"; break;
            case 11: retValue += "Nov"; break;
            case 12: retValue += "Dec"; break;
        }
        return retValue;
    }

    toonDagRooster(DATUM: string) {
        this.roosterDatum = DateTime.fromSQL(DATUM);
        setTimeout(() => this.popup.openPopup(), 100); // kleine delay datum moet syncen
    }
}
