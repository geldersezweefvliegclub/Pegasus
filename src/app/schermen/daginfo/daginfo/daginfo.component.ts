import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {LoginService} from '../../../services/apiservice/login.service';
import {DaginfoService} from '../../../services/apiservice/daginfo.service';
import {SharedService} from '../../../services/shared/shared.service';
import {DateTime} from 'luxon';
import {Observable, of, Subscription} from 'rxjs';
import {ErrorMessage, SuccessMessage} from '../../../types/Utils';
import {
    HeliosDagInfo,
    HeliosDagRapportenDataset,
    HeliosDienstenDataset,
    HeliosRoosterDataset,
    HeliosType
} from '../../../types/Helios';
import {TypesService} from '../../../services/apiservice/types.service';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {faFileImport, faInfo, faMinusCircle, faPlane, faUndo, faUsers} from '@fortawesome/free-solid-svg-icons';
import {StorageService} from '../../../services/storage/storage.service';
import {DagRoosterComponent} from "../../../shared/components/dag-rooster/dag-rooster.component";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {DienstenService} from "../../../services/apiservice/diensten.service";
import {DagRapportenService} from "../../../services/apiservice/dag-rapporten.service";
import {
    DagRapportEditorComponent
} from "../../../shared/components/editors/dag-rapport-editor/dag-rapport-editor.component";

@Component({
    selector: 'app-daginfo',
    templateUrl: './daginfo.component.html',
    styleUrls: ['./daginfo.component.scss']
})
export class DaginfoComponent implements OnInit, OnDestroy{
    @ViewChild(DagRoosterComponent) dienstenWizard: DagRoosterComponent;
    @ViewChild(DagRapportEditorComponent) editor: DagRapportEditorComponent;

    iconCardIcon: IconDefinition = faInfo;
    iconVliegveld: IconDefinition = faPlane;
    iconDiensten: IconDefinition = faUsers;
    iconDefault: IconDefinition = faFileImport;
    deleteIcon: IconDefinition = faMinusCircle;
    restoreIcon: IconDefinition = faUndo;

    private datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime = DateTime.now();              // de gekozen dag

    private dagInfoAbonnement: Subscription;
    dagInfo: HeliosDagInfo;

    private dienstenAbonnement: Subscription;
    private roosterAbonnement: Subscription;
    rooster: HeliosRoosterDataset[];
    diensten: HeliosDienstenDataset[];
    dagRapporten: HeliosDagRapportenDataset[];

    private typesAbonnement: Subscription;
    veldTypes$: Observable<HeliosType[]>;
    baanTypes$: Observable<HeliosType[]>;
    startMethodeTypes$: Observable<HeliosType[]>;

    magOpslaan: boolean = false;
    toonDagRapport: boolean = false;
    deleteMode: boolean = false;
    trashMode: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;

    veld_id: number| undefined;     // Default waarde voor dagrapport

    constructor(private readonly loginService: LoginService,
                private readonly typesService: TypesService,
                private readonly sharedService: SharedService,
                private readonly daginfoService: DaginfoService,
                private readonly storageService: StorageService,
                private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService,
                private readonly dagRapportenService: DagRapportenService) {
    }

    ngOnInit(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.magOpslaan = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.startMethodeTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 5}));    // startmethodes
            this.veldTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 9}));            // vliegvelden
            this.baanTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 1}));            // vliegvelden
        });

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
            this.opvragen();
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
            this.diensten = (diensten) ? diensten : [];
            this.heeftToegangDagRapport();
        });

        // abonneer op wijziging van rooster
        this.roosterAbonnement = this.roosterService.roosterChange.subscribe(maandRooster => {
            this.rooster = (maandRooster) ? maandRooster : [];
            this.heeftToegangDagRapport();
        });
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement)       this.typesAbonnement.unsubscribe();
        if (this.dagInfoAbonnement)     this.dagInfoAbonnement.unsubscribe();
        if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
        if (this.dienstenAbonnement)    this.dienstenAbonnement.unsubscribe();
        if (this.roosterAbonnement)     this.roosterAbonnement.unsubscribe();
    }

    opvragen(): void {
        this.dagRapportenService.getDagRapporten(this.trashMode, this.datum.toISODate() as string).then((dr) => this.dagRapporten = dr);
    }

    // mag de gebruiker de dag info zien?
    heeftToegangDagRapport(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        let tonen = false;

        if (this.datumInToekomst()) {
            tonen = false;
        }
        else if (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT) {
            tonen = true;
        } else if (this.rooster) {
            const d = this.datum.toISODate();
            let rooster: HeliosRoosterDataset | undefined = this.rooster.find((dag) => d == dag.DATUM!)

            if (rooster) {
                if (rooster.DDWV)               // het is een DWWV dag, misschien toch alles tonen
                {
                    if (ui?.isBeheerderDDWV) {  // Beheerder DDWV mag op DDWV dag alles inzien
                        tonen = true;
                    } else {
                        const diensten: HeliosDienstenDataset[] | undefined = this.diensten.filter((dag) => d == dag.DATUM!)

                        if (diensten) {
                            diensten.forEach(dienst => {
                                if (dienst.LID_ID == this.loginService.userInfo?.LidData?.ID) { // de ingelode gebruiker had dienst, toon alles
                                    tonen = true;
                                }
                            });
                        }
                    }
                }
            }
        }
        this.toonDagRapport = tonen;
    }

    // Mogen we uberhaupt de daginfo opslaan
    opslaanDisabled() {
        return !(this.dagInfo.VELD_ID && this.dagInfo.STARTMETHODE_ID && this.dagInfo.STARTMETHODE_ID > 0);
    }

    // opslaan van de ingevoerde dag rapport
    opslaanDagInfo() {
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

    // Extra vraag voordat de daginfo als verwijderd gemarkeerd wordt
    bevestigVerwijderen() {
        if (this.dagInfo.ID != undefined) {
            if (confirm("Weet u zeker dat de daginfo verwijderd mag worden?")) {
                try {
                    this.daginfoService.deleteDagInfo(this.dagInfo.ID).then(() => {
                        const datum = this.dagInfo.DATUM!.split('-');
                        const d = datum[2] + '-' + datum[1] + '-' + datum[0];
                        this.success = {titel: "Dag info", beschrijving: d + " is verwijderd"}
                        this.error = undefined;

                        this.dagInfo = {};
                    });
                } catch (e) {
                    this.error = e;
                }
            }
        }
    }

    deleteModeJaNee() {
        this.deleteMode = !this.deleteMode;

        if (this.trashMode) {
            this.trashModeJaNee(false);
        }
    }

    trashModeJaNee(actief: boolean) {
        this.trashMode = actief;
        this.opvragen();
    }


    magDagRapportVerwijderen(dr: HeliosDagRapportenDataset) {
        const ui = this.loginService.userInfo;
        return (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == dr.INGEVOERD_ID);
    }

    magDagRapportHerstellen(dr: HeliosDagRapportenDataset) {
        const ui = this.loginService.userInfo;
        return  (ui?.Userinfo?.isCIMT || ui?.Userinfo?.isBeheerder || ui?.LidData?.ID == dr.INGEVOERD_ID);
    }


    // Wizard om tekst te genereren voor aanwezige leden. Tekst kan daarna aangepast worden
    invullenDiensten() {
        this.dienstenWizard.openPopup();
    }

    tijdString(dt: string): string {
        const datumtijd = DateTime.fromSQL(dt);
        return datumtijd.toFormat("HH:mm")
    }

    datumString(dt: string): string {
        const datumtijd = DateTime.fromSQL(dt);
        return datumtijd.day + "-" + datumtijd.month + "-" + datumtijd.year;
    }

    // Hebben we een datum in de toekomst, vandaag is geen toekomst
    datumInToekomst(): boolean {
        const datum = this.datum.toISODate() as string;

        const nu: DateTime = DateTime.now();
        const d: DateTime = DateTime.fromSQL(datum);

        return (d > nu) // datum is in het toekomst
    }

    addDagRapport() {
        this.editor.openPopup()
    }

    openEditor(dagRapport: HeliosDagRapportenDataset) {
        this.editor.openPopup(dagRapport)
    }

    openVerwijderPopup(dagRapport: HeliosDagRapportenDataset) {
        this.editor.openVerwijderPopup(dagRapport)
    }

    openRestorePopup(dagRapport: HeliosDagRapportenDataset) {
        this.editor.openRestorePopup(dagRapport)
    }
}
