import {Component, ViewChild} from '@angular/core';
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


@Component({
    selector: 'app-daginfo',
    templateUrl: './daginfo.component.html',
    styleUrls: ['./daginfo.component.scss']
})
export class DaginfoComponent {
    @ViewChild(ComposeMeteoComponent) meteoWizard: ComposeMeteoComponent;
    @ViewChild(ComposeBedrijfComponent) bedrijfWizard: ComposeBedrijfComponent;

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

    datumAbonnement: Subscription;
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
                private readonly loginService: LoginService) {

        this.typesService.getTypes(5).then(types => this.startMethodeTypes$ = of(types));
        this.typesService.getTypes(9).then(types => this.veldTypes$ = of(types));

        // de datum zoals die in de kalender gekozen is
        this.datumAbonnement = this.sharedService.ingegevenDatum.subscribe(datum => {
            this.datum = DateTime.fromObject({
                year: datum.year,
                month: datum.month,
                day: datum.day
            })
        })

        this.dagInfoAbonnement = this.daginfoService.dagInfoChange.subscribe(di => { this.dagInfo = di})
        const dagInfoTekstRegels = this.storageService.ophalen('dagInfoTekstRegels');
        if (dagInfoTekstRegels) {
            this.tekstRegels = 1*dagInfoTekstRegels;
        }

    }

    ngOnInit(): void {
        let ui = this.loginService.userInfo?.Userinfo;
        this.magToevoegen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magVerwijderen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
        this.magWijzigen = (ui?.isBeheerder || ui?.isBeheerderDDWV || ui?.isStarttoren || ui?.isCIMT) ? true : false;
    }

    opslaanDagInfo() {
        if (this.dagInfo.ID == undefined) {
            this.daginfoService.nieuweDagInfo(this.dagInfo).then((di) => this.dagInfo = di);
        } else {
            this.daginfoService.updateDagInfo(this.dagInfo).then((di) => this.dagInfo = di);
        };
    }

    bevestigVerwijderen() {
        if (this.dagInfo.ID != undefined) {
            if (confirm("Weet u zeker dat de daginfo verwijderd mag worden?")) {
                this.daginfoService.deleteDagInfo(this.dagInfo.ID).then();
                this.dagInfo = {};
            }
        }
    }

    invullenMeteo() {
        this.meteoWizard.openPopup();
    }

    invullenVliegbedrijf() {
        this.bedrijfWizard.openPopup();
    }

    storeTextRegels() {
        this.storageService.opslaan('dagInfoTekstRegels', this.tekstRegels, -1);
    }
}
