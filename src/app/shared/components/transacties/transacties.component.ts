import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { TransactiesService } from '../../../services/apiservice/transacties.service';
import { HeliosTransactiesDataset } from '../../../types/Helios';
import { Subscription } from 'rxjs';
import { DateTime } from 'luxon';
import { SchermGrootte, SharedService } from '../../../services/shared/shared.service';
import { LoginService } from '../../../services/apiservice/login.service';
import { TransactieEditorComponent } from '../editors/transactie-editor/transactie-editor.component';
import { IdealBestellenComponent } from '../ideal-bestellen/ideal-bestellen.component';

@Component({
    selector: 'app-transacties',
    templateUrl: './transacties.component.html',
    styleUrls: ['./transacties.component.scss']
})
export class TransactiesComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @ViewChild(TransactieEditorComponent) private editor: TransactieEditorComponent;
    @ViewChild(IdealBestellenComponent) private bestellen: IdealBestellenComponent;

    @Output() TransactieGedaan: EventEmitter<void> = new EventEmitter<void>();

    private resizeSubscription: Subscription;       // Abonneer op aanpassing van window grootte (of draaien mobiel)
    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    datum: DateTime = DateTime.now();               // de gekozen dag

    magCorrigeren = false;
    magBestellen = false;
    lidID: number;

    transacties: HeliosTransactiesDataset[];
    transactiesView = "grid";
    expandedView = false;

    constructor(private readonly sharedService: SharedService,
                private readonly loginService: LoginService,
                private readonly transactiesService: TransactiesService) {
    }

    ngOnInit(): void {
        this.onWindowResize();          // bepaal wat we moeten tonen dag/week/maand

        // de datum zoals die in de kalender gekozen is
        this.maandAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
            if (jaarMaand.year > 1900) {        // 1900 is bij initialisatie
                this.datum = DateTime.fromObject({
                    year: jaarMaand.year,
                    month: jaarMaand.month,
                    day: 1,
                })
            }
        });

        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day,
            })
        });

        // Roep onWindowResize aan zodra we het event ontvangen hebben
        this.resizeSubscription = this.sharedService.onResize$.subscribe(size => {
            this.onWindowResize();
        });

        const ui = this.loginService.userInfo?.Userinfo;
        if (ui!.isBeheerder || ui!.isBeheerderDDWV) {
            this.magCorrigeren = true;
        }
    }

    ngOnDestroy(): void {
        if (this.datumAbonnement) this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement) this.maandAbonnement.unsubscribe();
        if (this.resizeSubscription) this.resizeSubscription.unsubscribe();
    }

    onWindowResize() {
        if (this.sharedService.getSchermSize() <= SchermGrootte.sm) {
            this.transactiesView = "card"
        } else {
            this.transactiesView = "grid"
        }
    }

    openPopup(lidID: number, magBestellen: boolean) {
        this.lidID = lidID;
        this.magBestellen = magBestellen;
        this.opvragen(lidID);
        this.popup.open();
    }

    nieuweBetaling() {
        this.bestellen.openPopup(this.lidID)
    }

    toonEditor() {
        this.editor.openPopup(this.lidID)
    }

    // Dit is al geimplementeerd in util.ts
    datumDMY(dagDatum: string) {

        if (dagDatum === null || dagDatum === undefined) return "";

        const dt = dagDatum.split(' ');
        const d = dt[0].split('-');

        const tijd = (dt.length > 1) ? " " + dt[1].substring(0, 5) : '';
        return d[2] + '-' + d[1] + '-' + d[0] + tijd
    }

    // Opvragen van de starts via de api
    opvragen(lidID: number): void {
        const beginDatum = DateTime.fromObject({
            year: this.datum.year,
            month: 1,
            day: 1
        });
        const eindDatum = DateTime.fromObject({
            year: this.datum.year,
            month: 12,
            day: 31
        });

        this.transactiesService.getTransacties(lidID, beginDatum, eindDatum).then((transacties) => {
            this.transacties = transacties;
        })
    }

    // er is een transactie gedaan, opnieuw ophalen alle transactie en geef trigger aan parent om profiel opnieuw te laden
    reload() {
        this.opvragen(this.lidID);
        this.TransactieGedaan.emit();
    }

    popupClass() {
        return (this.sharedService.getSchermSize() > SchermGrootte.sm) ? "popupMedium" : "popupLarge";
    }
}
