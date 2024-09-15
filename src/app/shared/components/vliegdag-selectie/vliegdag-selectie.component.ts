import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbCalendar, NgbDate, NgbDatepickerNavigateEvent, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';
import { LoginService } from '../../../services/apiservice/login.service';
import { HeliosActie, KalenderMaand } from '../../../types/Utils';
import { delay } from 'rxjs/operators';
import { SharedService } from '../../../services/shared/shared.service';
import { Subscription } from 'rxjs';
import { StartlijstService } from '../../../services/apiservice/startlijst.service';
import { getBeginEindDatumVanMaand } from '../../../utils/Utils';
import { DaginfoService } from '../../../services/apiservice/daginfo.service';
import { RoosterService } from '../../../services/apiservice/rooster.service';
import { DagRapportenService } from '../../../services/apiservice/dag-rapporten.service';
import { DienstenService } from '../../../services/apiservice/diensten.service';

@Component({
    selector: 'app-vliegdag-selectie',
    templateUrl: './vliegdag-selectie.component.html',
    styleUrls: ['./vliegdag-selectie.component.scss']
})
export class VliegdagSelectieComponent implements OnInit, OnDestroy {
    private dbEventAbonnement: Subscription;
    private dagInfoAbonnement: Subscription;
    private dienstenAbonnement: Subscription;

    readonly vandaag = this.calendar.getToday();
    kalenderIngave: NgbDateStruct = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day};  // de gekozen dag
    kalenderMaand: KalenderMaand;
    startDatum: DateTime;
    eindDatum: DateTime;

    kalenderEersteDatum: NgbDateStruct;
    kalenderLaatsteDatum: NgbDateStruct;

    vliegdagen = "";        // vliegdagen van deze maand in json formaat
    diensten = "";          // daginfos van deze maand in json formaat
    daginfo = "";           // daginfos van deze maand in json formaat

    constructor(readonly loginService: LoginService,
                private readonly calendar: NgbCalendar,
                private readonly sharedService: SharedService,
                private readonly daginfoService: DaginfoService,
                private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService,
                private readonly startlijstService: StartlijstService,
                private readonly dagRapportenService: DagRapportenService,)
    {

    }

    ngOnInit() {
        const ui = this.loginService.userInfo?.Userinfo;

        // Starttoren mag geen datum kiezen, alleen vandaag
        if (ui?.isStarttoren) {
            this.kalenderEersteDatum = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day}
            this.kalenderLaatsteDatum = {year: this.vandaag.year, month: this.vandaag.month, day: this.vandaag.day}
        } else {
            this.kalenderEersteDatum = {year: 2015, month: 1, day: 1}
            this.kalenderLaatsteDatum = {year: this.vandaag.year + 1, month: 12, day: 31}
        }

        // Als daginfo of startlijst is aangepast, moet we kalender achtergrond ook updaten
        // Omdat dit minder belangrijk is dan andere API calls, een kleine vertraging
        this.dbEventAbonnement = this.sharedService.heliosEventFired.pipe(delay(500)).subscribe(ev => {
            if (ev.tabel == "Startlijst") {
                if (ev.actie == HeliosActie.Delete || ev.actie == HeliosActie.Restore) {

                    // bij verwijderen-restore, gaan we altijd dagen opvragen
                    this.startlijstService.getVliegdagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.vliegdagen = JSON.stringify(dataset);
                    });
                } else if (!this.vliegdagen.includes(ev.data.DATUM)) {

                    // nieuwe vliegdagen ophalen als we deze dag nog niet hebben (include faalt)
                    this.startlijstService.getVliegdagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.vliegdagen = JSON.stringify(dataset);
                    });
                }
            }

            if (ev.tabel == "DagRapporten") {
                if (ev.actie == HeliosActie.Delete || ev.actie == HeliosActie.Restore) {

                    // bij verwijderen-restore, gaan we altijd dagen opvragen
                    this.dagRapportenService.getDagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.daginfo = JSON.stringify(dataset);
                    });
                } else if (!this.daginfo.includes(ev.data.DATUM)) {

                    // nieuwe daginfo ophalen als we deze dag nog niet hebben (include faalt)
                    this.dagRapportenService.getDagen(this.startDatum, this.eindDatum).then((dataset) => {
                        this.daginfo = JSON.stringify(dataset);
                    });
                }
            }
        })


        // abonneer op wijziging van diensten
        this.dienstenAbonnement = this.dienstenService.dienstenChange.subscribe(maandDiensten => {
            const ui = this.loginService.userInfo?.LidData;
            this.diensten = JSON.stringify(maandDiensten!.filter((dienst) => {
                return dienst.LID_ID == ui!.ID
            }));
        });
    }

    ngOnDestroy(): void {
        if (this.dienstenAbonnement) this.dienstenAbonnement.unsubscribe();
        if (this.dbEventAbonnement) this.dbEventAbonnement.unsubscribe();
        if (this.dagInfoAbonnement) this.dagInfoAbonnement.unsubscribe();
    }

    isDagVliegdag(dag: DateTime): boolean {
        return this.vliegdagen.includes(dag.toISODate() as string)
    }

    isDagInfoIngevuldVoorDag(dag: DateTime): boolean {
        return this.daginfo.includes(dag.toString())
    }

    isGebruikerIngeroosterdVoorDag(dag: DateTime): boolean {
        return this.diensten.includes('"DATUM":"' + dag.toISODate());
    }

    cssCustomDay(date: NgbDate): string {
        const datum: DateTime = DateTime.fromObject({year: date.year, month: date.month, day: date.day})

        let classes = "";
        if (this.isDagVliegdag(datum)) {
            classes += " vliegdag";
        }

        if (this.isDagInfoIngevuldVoorDag(datum)) {
            classes += " dagrapport";
        }

        if (this.isGebruikerIngeroosterdVoorDag(datum)) {
            classes += " diensten";
        }

        const gekozenDatum = DateTime.fromObject({
            year: this.kalenderIngave.year,
            month: this.kalenderIngave.month,
            day: this.kalenderIngave.day
        });
        if (datum.toISODate() == gekozenDatum.toISODate()) {
            classes += " gekozenDatum";
        }

        return classes;
    }

    nieuweDatumGeselecteerd($event: NgbDate) {
        this.sharedService.zetKalenderDatum({
            year: this.kalenderIngave.year,
            month: this.kalenderIngave.month,
            day: this.kalenderIngave.day
        })
    }

    // de kalender popup toont andere maand, ophalen vliegdagen
    onMonthSelectionChange($event: NgbDatepickerNavigateEvent) {
        this.KalenderAndereMaand($event);
    }

    KalenderAndereMaand($event: NgbDatepickerNavigateEvent) {
        this.kalenderMaand = $event.next;

        // laat iedereen weten dat we een ander maand-jaar hebben
        // niet nodig bij initialiseren. current is dan niet gevuld. We weten wel dat we 'vandaag' als init datum hebben
        if ($event.current) {
            this.sharedService.zetKalenderMaand(this.kalenderMaand);
        }

        const beginEindData = getBeginEindDatumVanMaand(this.kalenderMaand.month, this.kalenderMaand.year)
        this.startDatum = beginEindData.begindatum
        this.eindDatum = beginEindData.einddatum;

        this.startlijstService.getVliegdagen(this.startDatum, this.eindDatum).then((dataset) => {
            this.vliegdagen = JSON.stringify(dataset);
        });

        this.dagRapportenService.getDagen(this.startDatum, this.eindDatum).then((dataset) => {
            this.daginfo = JSON.stringify(dataset);
        });

        const ui = this.loginService.userInfo?.LidData;
        this.dienstenService.getDiensten(this.startDatum, this.eindDatum, undefined, ui?.ID).then((dataset) => {
            this.diensten = JSON.stringify(dataset);
        });
    }


    /**
     * Als voor een dag één of meer waar is:
     * - Je bent op de dag ingeroosterd
     * - De dag was een vliegdag
     * - De dag heeft dag info ingevuld
     * Dan returned deze functie een string die verteld welk van de bovenstaande waar is.
     * Als geen conditie waar is dan geeft deze functie undefined terug, zodat er geen tooltip voor deze dag komt
     */
    getTooltipText(ngDate: NgbDate): string | undefined {
        const tooltipParts: string[] = [];
        const datum: DateTime = DateTime.fromObject({year: ngDate.year, month: ngDate.month, day: ngDate.day})
        if (this.isDagInfoIngevuldVoorDag(datum)) tooltipParts.push("Daginfo ingevuld")
        if (this.isDagVliegdag(datum)) tooltipParts.push("Vliegdag")
        if (this.isGebruikerIngeroosterdVoorDag(datum)) tooltipParts.push("Ingeroosterd")

        return tooltipParts.length > 0 ? tooltipParts.join(' & ') : undefined;
    }
}
