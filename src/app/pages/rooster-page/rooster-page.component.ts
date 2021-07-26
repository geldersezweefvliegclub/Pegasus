import {Component, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {LedenService} from '../../services/apiservice/leden.service';
import {HeliosLedenDataset, HeliosRoosterDag, HeliosRoosterDataset} from '../../types/Helios';
import {faCalendarDay, faUsers} from '@fortawesome/free-solid-svg-icons';
import {SharedService} from '../../services/shared/shared.service';
import {Subscription} from 'rxjs';
import {RoosterService} from '../../services/apiservice/rooster.service';
import {getBeginEindDatumVanMaand} from '../../utils/Utils';
import {CustomError} from '../../types/Utils';
import {DateTime} from 'luxon';

/*
{
            "ID": 14,
            "DATUM": "1953-10-18",
            "DDWV": true,
            "CLUB_BEDRIJF": false,
            "OCHTEND_DDI_ID": null,
            "OCHTEND_INSTRUCTEUR_ID": null,
            "OCHTEND_LIERIST_ID": null,
            "OCHTEND_HULPLIERIST_ID": null,
            "OCHTEND_STARTLEIDER_ID": null,
            "MIDDAG_DDI_ID": null,
            "MIDDAG_INSTRUCTEUR_ID": null,
            "MIDDAG_LIERIST_ID": null,
            "MIDDAG_HULPLIERIST_ID": null,
            "MIDDAG_STARTLEIDER_ID": null,
            "VERWIJDERD": false,
            "LAATSTE_AANPASSING": "2021-06-05 07:34:59",
            "OCHTEND_DDI": null,
            "OCHTEND_INSTRUCTEUR": null,
            "OCHTEND_HULPLIERIST": null,
            "OCHTEND_STARTLEIDER": null,
            "MIDDAG_DDI": null,
            "MIDDAG_INSTRUCTEUR": null,
            "MIDDAG_LIERIST": null,
            "OCHTEND_LIERIST": null,
            "MIDDAG_HULPLIERIST": null,
            "MIDDAG_STARTLEIDER": null
        }
*/
@Component({
  selector: 'app-rooster-page',
  templateUrl: './rooster-page.component.html',
  styleUrls: ['./rooster-page.component.scss']
})
export class RoosterPageComponent implements OnInit {
  readonly roosterIcon = faCalendarDay;
  readonly ledenIcon = faUsers;
  toonStartleiders = true;
  toonInstructeurs = true;
  toonLieristen = true;
  teZoekenNaam: string | undefined;
  alleLeden: HeliosLedenDataset[];
  gefilterdeLeden: HeliosLedenDataset[];
  huidigJaar: number;
  huidigMaand: number;
  private datumAbonnement: Subscription;
  private ledenTimer: number;
  isLoading: boolean = false;
  rooster: HeliosRoosterDataset[];
  temparray = new Array(1);


  constructor(
    private readonly ledenService: LedenService,
    private readonly sharedService: SharedService,
    private readonly roosterService: RoosterService) {
  }

  onDropInTable(event: CdkDragDrop<any, any>, dagInRooster: HeliosRoosterDag, property: HTMLDivElement): void {
    console.log(event.item.data);
    // Als de actie in dezelfde container is gebleven is er een re-ordering geweest, dus verplaatsen we de item in de array ook
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    const taak = property.id.split('-')[0];
    dagInRooster[taak] = event.item.data.NAAM;
    dagInRooster[taak + '_ID'] = event.item.data.ID;
    console.log(property.id);
  }

  getIDFromDrop(event: CdkDragDrop<any, any>): string | undefined {
    console.log(event.item.data);
    return event.item.data.ID;
  }

  filter(): void {
    this.isLoading = true;
    this.gefilterdeLeden = this.alleLeden.filter(ongefilterdLid => {
      let magTonen = false;
      if (this.toonLieristen) {
        magTonen = ongefilterdLid.LIERIST == true;
      }
      if (this.toonStartleiders) {
        magTonen = ongefilterdLid.STARTLEIDER == true;
      }
      if (this.toonInstructeurs) {
        magTonen = ongefilterdLid.INSTRUCTEUR == true;
      }
      return magTonen;
    });
    this.isLoading = false;
  }

  getLeden(): void {
    this.isLoading = true;
    clearTimeout(this.ledenTimer);
    this.ledenTimer = window.setTimeout(() => {
      let zoekString = undefined;
      if (this.teZoekenNaam && this.teZoekenNaam !== '') {
        zoekString = this.teZoekenNaam;
      }
      this.ledenService.getLeden(false, zoekString).then(leden => {
        this.alleLeden = leden;
        this.filter();
        this.isLoading = false;
      }).catch(e => this.catchError(e));
    }, 400);
  }

  private getRooster(): void {
    this.isLoading = true;
    const beginEindDatum = getBeginEindDatumVanMaand(this.huidigMaand, this.huidigJaar);
    this.roosterService.getRooster(beginEindDatum.begindatum, beginEindDatum.einddatum).then(rooster => {
      console.log(rooster);
      this.rooster = rooster;
      this.vulMissendeDagenAan();
      this.isLoading = false;
    }).catch(e => this.catchError(e));
  }

  private opvragen() {
    this.getLeden();
    this.getRooster();
  }

  ngOnInit(): void {
    this.datumAbonnement = this.sharedService.kalenderMaandChange.subscribe(jaarMaand => {
      this.huidigMaand = jaarMaand.month;
      this.huidigJaar = jaarMaand.year;
      this.opvragen();
    });
  }

  private catchError(e: CustomError) {
    console.error(e);
    this.isLoading = false;
  }

  private vulMissendeDagenAan() {
    const dagenInDeMaand = DateTime.fromObject({year: this.huidigJaar, month: this.huidigMaand}).daysInMonth;
    for (let i = 0; i < dagenInDeMaand; i++) {
      const datumInRooster = DateTime.fromISO((this.rooster[i]?.DATUM || ''));
      const nieuwDagInRooster: HeliosRoosterDag = {
        DATUM: DateTime.fromObject({month: this.huidigMaand, year: this.huidigJaar, day: i + 1}).toISODate()
      };

      if (datumInRooster.isValid) {
        console.log('Is valid');
        const dag = datumInRooster.day;
        if (dag > i + 1) {
          this.rooster.splice(i, 0, nieuwDagInRooster);
        }
      } else {
        console.log('Niet valid');
        this.rooster.splice(i, 0, nieuwDagInRooster);
      }
    }
  }
}
