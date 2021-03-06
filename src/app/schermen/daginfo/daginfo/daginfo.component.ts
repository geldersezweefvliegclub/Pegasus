import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {LoginService} from '../../../services/apiservice/login.service';
import {DaginfoService} from '../../../services/apiservice/daginfo.service';
import {SharedService} from '../../../services/shared/shared.service';
import {DateTime} from 'luxon';
import {Observable, of, Subscription} from 'rxjs';
import {ErrorMessage, SuccessMessage} from '../../../types/Utils';
import {HeliosDagInfo, HeliosDienstenDataset, HeliosRoosterDataset, HeliosType} from '../../../types/Helios';
import {TypesService} from '../../../services/apiservice/types.service';
import {IconDefinition} from '@fortawesome/free-regular-svg-icons';
import {
    faCloudSunRain,
    faFileImport,
    faFlagCheckered,
    faFrown,
    faInfo,
    faPlane,
    faTruck,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import {faArtstation} from '@fortawesome/free-brands-svg-icons';
import {faPaperPlane} from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import {ComposeMeteoComponent} from '../compose-meteo/compose-meteo.component';
import {ComposeBedrijfComponent} from '../compose-bedrijf/compose-bedrijf.component';
import {StorageService} from '../../../services/storage/storage.service';
import {DagRoosterComponent} from "../../../shared/components/dag-rooster/dag-rooster.component";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {DienstenService} from "../../../services/apiservice/diensten.service";

@Component({
    selector: 'app-daginfo',
    templateUrl: './daginfo.component.html',
    styleUrls: ['./daginfo.component.scss']
})
export class DaginfoComponent implements OnInit, OnDestroy{
    @ViewChild(ComposeMeteoComponent) meteoWizard: ComposeMeteoComponent;
    @ViewChild(ComposeBedrijfComponent) bedrijfWizard: ComposeBedrijfComponent;
    @ViewChild(DagRoosterComponent) dienstenWizard: DagRoosterComponent;

    iconCardIcon: IconDefinition = faInfo;
    iconBedrijf: IconDefinition = faArtstation;
    iconVliegveld: IconDefinition = faPlane;
    iconDiensten: IconDefinition = faUsers;
    iconMeteo: IconDefinition = faCloudSunRain;
    iconVliegend: IconDefinition = faPaperPlane;
    iconRollend: IconDefinition = faTruck;
    iconVerslag: IconDefinition = faFlagCheckered;
    iconIncident: IconDefinition = faFrown;
    iconDefault: IconDefinition = faFileImport;

    private datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime = DateTime.now();              // de gekozen dag

    private dagInfoAbonnement: Subscription;
    dagInfo: HeliosDagInfo;

    private dienstenAbonnement: Subscription;
    private roosterAbonnement: Subscription;
    rooster: HeliosRoosterDataset[];
    diensten: HeliosDienstenDataset[];

    private typesAbonnement: Subscription;
    veldTypes$: Observable<HeliosType[]>;
    baanTypes$: Observable<HeliosType[]>;
    startMethodeTypes$: Observable<HeliosType[]>;

    magToevoegen: boolean = false;
    magVerwijderen: boolean = false;
    magWijzigen: boolean = false;
    magExporten: boolean = false;
    toonUitgebreid: boolean = false;
    geenToegang: boolean = false;

    success: SuccessMessage | undefined;
    error: ErrorMessage | undefined;
    tekstRegels: number = 4;

    constructor(private readonly daginfoService: DaginfoService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService,
                private readonly typesService: TypesService,
                private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService,
                private readonly loginService: LoginService) {
    }

    ngOnInit(): void {
        const ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.toonUitgebreid = !ui?.isStarttoren;

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
        })

        // abonneer op wijziging van kalender datum
        this.dagInfoAbonnement = this.daginfoService.dagInfoChange.subscribe(di => {
            this.dagInfo = di;
            this.heeftToegang();
        });

        // abonneer op wijziging van diensten
        this.dienstenAbonnement = this.dienstenService.dienstenChange.subscribe(diensten => {
            this.diensten = (diensten) ? diensten : [];
            this.heeftToegang();
        });

        // abonneer op wijziging van rooster
        this.roosterAbonnement = this.roosterService.roosterChange.subscribe(maandRooster => {
            this.rooster = (maandRooster) ? maandRooster : [];
            this.heeftToegang();
        });

        // aantal regels dat we tonen in de tekst invoer. Kan ingesteld worden te verkoming van scrollbars
        const dagInfoTekstRegels = this.storageService.ophalen('dagInfoTekstRegels');
        if (dagInfoTekstRegels) {
            this.tekstRegels = +dagInfoTekstRegels;    // conversie van string naar number
        }
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement)       this.typesAbonnement.unsubscribe();
        if (this.dagInfoAbonnement)     this.dagInfoAbonnement.unsubscribe();
        if (this.datumAbonnement)       this.datumAbonnement.unsubscribe();
        if (this.dienstenAbonnement)    this.dienstenAbonnement.unsubscribe();
        if (this.roosterAbonnement)     this.roosterAbonnement.unsubscribe();
    }

    // mag de gebruiker de dag info zien?
    async heeftToegang() {
        const ui = this.loginService.userInfo?.Userinfo;
        let geenToegang = true;

        if (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT || ui?.isStarttoren) {
            geenToegang = false;
        } else if (this.rooster) {
            const d = this.datum.toISODate();
            let rooster: HeliosRoosterDataset | undefined = this.rooster.find((dag) => d == dag.DATUM!)

            if (rooster) {
                if (rooster.DDWV)               // het is een DWWV dag, misschien toch alles tonen
                {
                    if (ui?.isBeheerderDDWV) {  // Beheerder DDWV mag op DDWV dag alles inzien
                        geenToegang = false;
                    } else {
                        const diensten: HeliosDienstenDataset[] | undefined = this.diensten.filter((dag) => d == dag.DATUM!)

                        if (diensten) {
                            diensten.forEach(dienst => {
                                if (dienst.LID_ID == this.loginService.userInfo?.LidData?.ID) { // de ingelode gebruiker had dienst, toon alles
                                    geenToegang = false;
                                }
                            });
                        }
                    }
                }
            }
        }
        this.geenToegang = geenToegang;
    }

    // Mogen we uberhaupt de daginfo opslaan
    magOpslaan() {
        return (this.dagInfo.VELD_ID && this.dagInfo.STARTMETHODE_ID && this.dagInfo.STARTMETHODE_ID > 0);
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

    // Wizard om tekst te genereren voor meteo input. Tekst kan daarna aangepast worden
    invullenMeteo() {
        this.meteoWizard.openPopup();
    }

    // Wizard om tekst te genereren voor vliegbedrijf. Tekst kan daarna aangepast worden
    invullenVliegbedrijf() {
        this.bedrijfWizard.openPopup();
    }

    // Wizard om tekst te genereren voor aanwezige leden. Tekst kan daarna aangepast worden
    invullenDiensten() {
        this.dienstenWizard.openPopup();
    }

    // als we meer tekst op scherm kunnen tonen, dan is dat de volgende keer ook zo, dus opslaan
    storeTextRegels() {
        this.storageService.opslaan('dagInfoTekstRegels', this.tekstRegels, -1);
    }
}
