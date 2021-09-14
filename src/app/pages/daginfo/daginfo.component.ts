import {Component, OnInit, ViewChild} from '@angular/core';

import {LoginService} from '../../services/apiservice/login.service';
import {DaginfoService} from '../../services/apiservice/daginfo.service';
import {SharedService} from '../../services/shared/shared.service';
import {DateTime} from 'luxon';
import {Observable, of, Subscription} from 'rxjs';
import {ErrorMessage, SuccessMessage} from '../../types/Utils';
import {HeliosDagInfo, HeliosRoosterDataset, HeliosType} from '../../types/Helios';
import {TypesService} from '../../services/apiservice/types.service';
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
import {ComposeMeteoComponent} from './compose-meteo/compose-meteo.component';
import {ComposeBedrijfComponent} from './compose-bedrijf/compose-bedrijf.component';
import {StorageService} from '../../services/storage/storage.service';
import {DagRoosterComponent} from "../../shared/components/dag-rooster/dag-rooster.component";
import {RoosterService} from "../../services/apiservice/rooster.service";
import {DienstenService} from "../../services/apiservice/diensten.service";

@Component({
    selector: 'app-daginfo',
    templateUrl: './daginfo.component.html',
    styleUrls: ['./daginfo.component.scss']
})
export class DaginfoComponent implements OnInit {
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

    datumAbonnement: Subscription;         // volg de keuze van de kalender
    datum: DateTime;                       // de gekozen dag

    dagInfoAbonnement: Subscription;
    dagInfo: HeliosDagInfo;

    veldTypes$: Observable<HeliosType[]>;
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

        this.typesService.getTypes(5).then(types => this.startMethodeTypes$ = of(types));   // startmethodes
        this.typesService.getTypes(9).then(types => this.veldTypes$ = of(types));           // vliegvelden

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
        })

        // aboneer op wijziging van kalender dataum
        this.dagInfoAbonnement = this.daginfoService.dagInfoChange.subscribe(di => {
            this.dagInfo = di;
            this.heeftToegang();
        });

        // aantal regels dat we tonen in de tekst invoer. Kan ingesteld worden te verkoming van scrollbars
        const dagInfoTekstRegels = this.storageService.ophalen('dagInfoTekstRegels');
        if (dagInfoTekstRegels) {
            this.tekstRegels = +dagInfoTekstRegels;    // conversie van string naar number
        }
    }

    // mag de gebruiker de dag info zien?
    async heeftToegang() {
        const ui = this.loginService.userInfo?.Userinfo;
        let geenToegang = true;

        if (ui?.isBeheerder || ui?.isInstructeur || ui?.isCIMT || ui?.isStarttoren) {
            geenToegang = false;
        } else {
            let rooster: HeliosRoosterDataset = {DDWV: false};     // we hebben alleen de DDWV variable nodig
            try {
                const r = await this.roosterService.getRooster(this.datum, this.datum);

                if (r.length > 0) {                 // er is een rooster voor de dag
                    if (r[0].DDWV == true) {        // het is een DWWV dag, misschien toch alles tonen
                        if (ui?.isBeheerderDDWV) {  // Beheerder DDWV mag op DDWV dag alles inzien
                            geenToegang = false;
                        } else {
                            const d = await this.dienstenService.getDiensten(this.datum, this.datum);

                            d.forEach(dienst => {
                                if (dienst.LID_ID == this.loginService.userInfo?.LidData?.ID) { // de ingelode gebruiker had dienst, toon alles
                                    geenToegang = false;
                                }
                            })

                        }
                    }
                }
            } catch (e) {
            }
        }
        this.geenToegang = geenToegang;
    }

    // opslaan van de ingevoerde dag rapport
    opslaanDagInfo() {
        const datum = this.dagInfo.DATUM!.split('-');
        const d = datum[2] + '-' + datum[1] + '-' + datum[0];

        try {
            if (this.dagInfo.ID == undefined) {
                this.daginfoService.addDagInfo(this.dagInfo).then((di) => {
                    this.dagInfo = di;
                    this.error = undefined;
                    this.success = {titel: "Dag info", beschrijving: d + " is toegevoegd"}
                });
            } else {
                this.daginfoService.updateDagInfo(this.dagInfo).then((di) => {
                    this.dagInfo = di;
                    this.error = undefined
                    this.success = {titel: "Dag info", beschrijving: d + " is aangepast"}
                });
            }
        }
        catch (e) {
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
                }
                catch (e) {
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
