import {Component, OnInit, ViewChild} from '@angular/core';
import {LoginService} from '../../services/apiservice/login.service';
import {DaginfoService} from '../../services/apiservice/daginfo.service';
import {SharedService} from '../../services/shared/shared.service';
import {DateTime} from 'luxon';
import {Observable, of, Subscription} from 'rxjs';
import {CustomError} from '../../types/Utils';
import {HeliosDagInfo, HeliosType} from '../../types/Helios';
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


@Component({
    selector: 'app-daginfo',
    templateUrl: './daginfo.component.html',
    styleUrls: ['./daginfo.component.scss']
})
export class DaginfoComponent implements OnInit{
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

    error: CustomError | undefined;
    tekstRegels: number = 4;

    constructor(private readonly daginfoService: DaginfoService,
                private readonly sharedService: SharedService,
                private readonly storageService: StorageService,
                private readonly typesService: TypesService,
                private readonly loginService: LoginService)  {

    }

    ngOnInit(): void {
        let ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;

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
        this.dagInfoAbonnement = this.daginfoService.dagInfoChange.subscribe(di => { this.dagInfo = di})

        // aantal regels dat we tonen in de tekst invoer. Kan ingesteld worden te verkoming van scrollbars
        const dagInfoTekstRegels = this.storageService.ophalen('dagInfoTekstRegels');
        if (dagInfoTekstRegels) {
            this.tekstRegels = +dagInfoTekstRegels;    // conversie van string naar number
        }
    }

    // opslaan van de ingevoerde dag rapport
    opslaanDagInfo() {
        if (this.dagInfo.ID == undefined) {
            this.daginfoService.addDagInfo(this.dagInfo).then((di) => this.dagInfo = di);
        } else {
            this.daginfoService.updateDagInfo(this.dagInfo).then((di) => this.dagInfo = di);
        }
    }

    // Extra vraag voordat de daginfo als verwijderd gemarkeerd wordt
    bevestigVerwijderen() {
        if (this.dagInfo.ID != undefined) {
            if (confirm("Weet u zeker dat de daginfo verwijderd mag worden?")) {
                this.daginfoService.deleteDagInfo(this.dagInfo.ID).then();
                this.dagInfo = {};
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
