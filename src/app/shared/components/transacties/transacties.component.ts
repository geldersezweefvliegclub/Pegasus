import {Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ModalComponent} from "../modal/modal.component";
import {TransactiesService} from "../../../services/apiservice/transacties.service";
import {HeliosTransactiesDataset} from "../../../types/Helios";
import {Subscription} from "rxjs";
import {DateTime} from "luxon";
import {SharedService} from "../../../services/shared/shared.service";
import {LoginService} from "../../../services/apiservice/login.service";
import {TransactieEditorComponent} from "../editors/transactie-editor/transactie-editor.component";

@Component({
    selector: 'app-transacties',
    templateUrl: './transacties.component.html',
    styleUrls: ['./transacties.component.scss']
})
export class TransactiesComponent implements OnInit, OnDestroy {
    @ViewChild(ModalComponent) private popup: ModalComponent;
    @ViewChild(TransactieEditorComponent) private editor: TransactieEditorComponent;

    @Output() TransactieGedaan: EventEmitter<void> = new EventEmitter<void>();

    private maandAbonnement: Subscription;          // volg de keuze van de kalender
    private datumAbonnement: Subscription;          // volg de keuze van de kalender
    datum: DateTime = DateTime.now();               // de gekozen dag

    magCorrigeren: boolean = false;
    lidID: number;

    transacties: HeliosTransactiesDataset[];
    constructor(private readonly sharedService: SharedService,
                private readonly loginService: LoginService,
                private readonly transactiesService: TransactiesService) {
    }

    ngOnInit(): void {
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

        const ui = this.loginService.userInfo?.Userinfo;
        if (ui!.isBeheerder || ui!.isBeheerderDDWV) {
            this.magCorrigeren = true;
        }
    }

    ngOnDestroy(): void {
        if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
        if (this.maandAbonnement)       this.maandAbonnement.unsubscribe();
    }

    openPopup(lidID: number) {
        this.lidID = lidID;
        this.opvragen(lidID);
        this.popup.open();
    }

    nieuweBetaling() {

    }

    toonEditor() {
        this.editor.openPopup(this.lidID)
    }

    // Dit is al geimplementeerd in util.ts
    datumDMY(dagDatum: string) {
        const dt = dagDatum.split(' ');
        const d = dt[0].split('-');
        return d[2] + '-' + d[1] + '-' + d[0] + ' ' + dt[1].substring(0, 5);
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
}
