import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgbDate, NgbDatepickerNavigateEvent, NgbDateStruct} from "@ng-bootstrap/ng-bootstrap";
import {DateTime} from "luxon";

@Component({
    selector: 'app-vliegdag-selectie',
    templateUrl: './vliegdag-selectie.component.html',
    styleUrls: ['./vliegdag-selectie.component.scss']
})
export class VliegdagSelectieComponent {
    @Input() kalenderEersteDatum: NgbDateStruct;
    @Input() kalenderLaatsteDatum: NgbDateStruct;
    @Input() kalenderIngave: NgbDateStruct;
    @Input() vliegdagen: string = "";        // vliegdagen van deze maand in json formaat
    @Input() diensten: string = "";          // daginfos van deze maand in json formaat
    @Input() daginfo: string = "";           // daginfos van deze maand in json formaat

    @Output() navigate: EventEmitter<NgbDatepickerNavigateEvent> = new EventEmitter<NgbDatepickerNavigateEvent>();
    @Output() dateSelect: EventEmitter<NgbDate> = new EventEmitter<NgbDate>();

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
        this.dateSelect.emit($event);
    }

    onMonthSelectionChange($event: NgbDatepickerNavigateEvent) {
        this.navigate.emit($event);
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
