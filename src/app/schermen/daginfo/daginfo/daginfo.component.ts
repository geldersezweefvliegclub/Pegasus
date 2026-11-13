import { Component, inject, OnDestroy, OnInit, viewChild } from '@angular/core';

import { LoginService } from '../../../services/apiservice/login.service';
import { DaginfoService } from '../../../services/apiservice/daginfo.service';
import { SharedService } from '../../../services/shared/shared.service';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import { ErrorMessage, SuccessMessage } from '../../../types/Utils';
import {
    HeliosDagInfo,
    HeliosDagRapportenDataset,
    HeliosRoosterDataset,
    HeliosType,
} from '../../../types/Helios';
import { TypesService } from '../../../services/apiservice/types.service';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faInfo, faMinusCircle, faPlane, faUndo, faUsers } from '@fortawesome/free-solid-svg-icons';
import { DagRoosterComponent } from '../../../shared/components/dag-rooster/dag-rooster.component';
import { RoosterService } from '../../../services/apiservice/rooster.service';
import { DienstenService } from '../../../services/apiservice/diensten.service';
import { DagRapportenService } from '../../../services/apiservice/dag-rapporten.service';
import {
    DagRapportEditorComponent,
} from '../../../shared/components/editors/dag-rapport-editor/dag-rapport-editor.component';
import { ErrorComponent } from '../../../shared/components/error/error.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { PegasusCardComponent } from '../../../shared/components/pegasus-card/pegasus-card.component';
import { StatusButtonComponent } from '../../../shared/components/status-button/status-button.component';
import { SuccessComponent } from '../../../shared/components/success/success.component';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-daginfo',
    host: { class: 'scherm-pagina' },
    templateUrl: './daginfo.component.html',
    styleUrls: ['./daginfo.component.scss'],
    imports: [DagRapportEditorComponent, DagRoosterComponent, ErrorComponent, IconButtonComponent, FormsModule, FaIconComponent, PegasusCardComponent, StatusButtonComponent, SuccessComponent]
})
export class DaginfoComponent implements OnInit, OnDestroy{
    // variablen in html formulier
    protected readonly editor = viewChild.required(DagRapportEditorComponent);

    protected iconCardIcon: IconDefinition = faInfo;
    protected iconVliegveld: IconDefinition = faPlane;
    protected iconDiensten: IconDefinition = faUsers;
    protected deleteIcon: IconDefinition = faMinusCircle;
    protected restoreIcon: IconDefinition = faUndo;
    protected datum: DateTime = DateTime.now();              // de gekozen dag
    protected dagInfo: HeliosDagInfo;
    protected rooster: HeliosRoosterDataset[] = [];
    protected dagRapporten: HeliosDagRapportenDataset[];
    protected veldTypes: HeliosType[] = [];
    protected baanTypes: HeliosType[] = [];
    protected startMethodeTypes: HeliosType[] = [];
    protected toonDagRapport = false;
    protected deleteMode = false;
    protected trashMode = false;
    protected success: SuccessMessage | undefined;
    protected error: ErrorMessage | undefined;
    protected veld_id: number| undefined;

    // private variable voor ts script
    private readonly loginService = inject(LoginService);
    private readonly typesService = inject(TypesService);
    private readonly sharedService = inject(SharedService);
    private readonly daginfoService = inject(DaginfoService);
    private readonly roosterService = inject(RoosterService);
    private readonly dienstenService = inject(DienstenService);
    private readonly dagRapportenService = inject(DagRapportenService);
    private readonly dienstenWizard = viewChild.required(DagRoosterComponent);

    private datumAbonnement: Subscription;         // volg de keuze van de kalender
    private dagInfoAbonnement: Subscription;
    private dienstenAbonnement: Subscription;
    private roosterAbonnement: Subscription;
    private typesAbonnement: Subscription;

    ngOnInit(): void {
        // TODO: rechtencontrole voor opslaan van de daginfo ontbreekt. Er was magOpslaan (isBeheerder, isBeheerderDDWV,
        //  isStarttoren of isCIMT), maar die werd nergens gecontroleerd. Bepalen of dit nodig is

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.startMethodeTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 5});    // startmethodes
            this.veldTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 9});            // vliegvelden
            this.baanTypes = dataset!.filter((t:HeliosType) => { return t.GROEP == 1});            // vliegvelden
        });

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
            this.opvragen();
            this.opvragenRooster();
            this.heeftToegangDagRapport();
        })

        // abonneer op wijziging van kalender datum
        this.dagInfoAbonnement = this.daginfoService.dagInfoChange.subscribe(di => {
            this.dagInfo = di;
            this.veld_id = (di.VELD_ID && !di.VELD_ID2) ? this.veld_id = di.VELD_ID : undefined;
            this.heeftToegangDagRapport();
        });

        // abonneer op wijziging van diensten
        this.dienstenAbonnement = this.dienstenService.dienstenChange.subscribe(diensten => {
            this.heeftToegangDagRapport();
        });

        // als het rooster is aangepast, opnieuw ophalen
        this.roosterAbonnement = this.sharedService.heliosEventFired.subscribe(ev => {
            if (ev.tabel == "Rooster") {
                this.opvragenRooster();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement)       this.typesAbonnement.unsubscribe();
        if (this.dagInfoAbonnement)     this.dagInfoAbonnement.unsubscribe();
        if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
        if (this.dienstenAbonnement)    this.dienstenAbonnement.unsubscribe();
        if (this.roosterAbonnement)     this.roosterAbonnement.unsubscribe();
    }

    protected opvragen(): void {
        this.dagRapportenService.getDagRapporten(this.trashMode, this.datum.toISODate() as string).then((dr) => this.dagRapporten = dr);
    }

    // mag de gebruiker de dag info zien?
    private heeftToegangDagRapport(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        let tonen = false;

        if (this.datumInToekomst()) {
            tonen = false;
        }
        else if (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) {
            tonen = true;
        } else if (this.rooster) {
            const d = this.datum.toISODate();
            const rooster: HeliosRoosterDataset | undefined = this.rooster.find((dag) => d == dag.DATUM!)

            if (rooster) {
                if (rooster.DDWV)               // het is een DWWV dag, misschien toch alles tonen
                {
                    if ((ui?.isBeheerderDDWV) || (ui?.isDDWVCrew)) {  // Beheerder DDWV mag op DDWV dag alles inzien
                        tonen = true;
                    }
                }
            }
        }
        this.toonDagRapport = tonen;
    }

    // Mogen we uberhaupt de daginfo opslaan
    protected opslaanDisabled() {
        return !(this.dagInfo.VELD_ID && this.dagInfo.STARTMETHODE_ID && this.dagInfo.STARTMETHODE_ID > 0);
    }

    // opslaan van de ingevoerde dag rapport
    protected opslaanDagInfo() {
        try {
            if (this.dagInfo.ID == undefined) {
                this.dagInfo.DATUM = this.datum.year + '-' + this.datum.month + '-' + this.datum.day
                this.daginfoService.addDagInfo(this.dagInfo).then((di) => {
                    this.dagInfo = di;
                    this.error = undefined;
                    this.success = {titel: "Dag info", beschrijving: this.sharedService.datumDMJ(di.DATUM) + " is toegevoegd"}
                });
            } else {
                this.daginfoService.updateDagInfo(this.dagInfo).then((di) => {
                    this.dagInfo = di;
                    this.error = undefined
                    this.success = {titel: "Dag info", beschrijving: this.sharedService.datumDMJ(di.DATUM)  + " is aangepast"}
                });
            }
        } catch (e) {
            this.error = e;
        }
    }

    protected deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
    }

    protected trashModeJaNee(actief: boolean) {
        this.trashMode = actief;
        this.opvragen();
    }

    protected magDagRapportVerwijderen(dr: HeliosDagRapportenDataset) {
        const ui = this.loginService.userInfo;
        return (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == dr.INGEVOERD_ID);
    }

    protected magDagRapportHerstellen(dr: HeliosDagRapportenDataset) {
        const ui = this.loginService.userInfo;
        return  (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == dr.INGEVOERD_ID);
    }

    // Wizard om tekst te genereren voor aanwezige leden. Tekst kan daarna aangepast worden
    protected invullenDiensten() {
        this.dienstenWizard().openPopup();
    }

    protected tijdString(dt: string): string {
        const datumtijd = this.sharedService.parseDatum(dt);
        return datumtijd.toFormat("HH:mm")
    }

    protected datumString(dt: string): string {
        const datumtijd = this.sharedService.parseDatum(dt);
        return datumtijd.day + "-" + datumtijd.month + "-" + datumtijd.year;
    }

    // Hebben we een datum in de toekomst, vandaag is geen toekomst
    protected datumInToekomst(): boolean {
        const datum = this.datum.toISODate() as string;

        const nu: DateTime = DateTime.now();
        const d: DateTime = DateTime.fromSQL(datum);

        return (d > nu) // datum is in het toekomst
    }

    protected addDagRapport() {
        this.editor().openPopup()
    }

    protected openEditor(dagRapport: HeliosDagRapportenDataset) {
        this.editor().openPopup(dagRapport)
    }

    protected openVerwijderPopup(dagRapport: HeliosDagRapportenDataset) {
        this.editor().openVerwijderPopup(dagRapport)
    }

    protected openRestorePopup(dagRapport: HeliosDagRapportenDataset) {
        this.editor().openRestorePopup(dagRapport)
    }

    // rooster van de gekozen dag ophalen, nodig om te bepalen of het een DDWV dag is
    private opvragenRooster(): void {
        const datum = this.datum;
        this.roosterService.getRooster(datum, datum).then((rooster) => {
            if (!datum.equals(this.datum)) return;     // intussen een andere dag gekozen
            this.rooster = rooster;
            this.heeftToegangDagRapport();
        });
    }
}
