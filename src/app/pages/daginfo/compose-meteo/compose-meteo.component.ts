import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {Observable, of} from 'rxjs';
import {TypesService} from '../../../services/apiservice/types.service';
import {HeliosType} from '../../../types/Helios';
import {ModalComponent} from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-compose-meteo',
  templateUrl: './compose-meteo.component.html',
  styleUrls: ['./compose-meteo.component.scss']
})
export class ComposeMeteoComponent {
  @Output() opslaan: EventEmitter<string> = new EventEmitter<string>();
  @ViewChild(ModalComponent) private popup: ModalComponent;

  windSterkteTypes$: Observable<HeliosType[]>;
  windRichtingTypes$: Observable<HeliosType[]>;
  windEigenschappenTypes$: Observable<HeliosType[]>;
  stijgenTypes$: Observable<HeliosType[]>;
  bewolkingTypes$: Observable<HeliosType[]>;
  dekkingTypes$: Observable<HeliosType[]>;
  zichtTypes$: Observable<HeliosType[]>;

  windRichting: string;
  windKracht: string;
  windEigenschappen: string;
  bewolking: string;
  bewolkingDekking: string;
  wolkenBasis: number;
  gemiddeldStijgen: string;
  zicht:string;

  constructor(private readonly typesService: TypesService) {
    this.typesService.getTypes(2).then(types => this.windRichtingTypes$ = of(types));
    this.typesService.getTypes(3).then(types => this.windSterkteTypes$ = of(types));
    this.typesService.getTypes(11).then(types => this.bewolkingTypes$ = of(types));
    this.typesService.getTypes(12).then(types => this.windEigenschappenTypes$ = of(types));
    this.typesService.getTypes(13).then(types => this.zichtTypes$ = of(types));
    this.typesService.getTypes(16).then(types => this.stijgenTypes$ = of(types));
    this.typesService.getTypes(17).then(types => this.dekkingTypes$ = of(types));
  }

  // Alle tags beginnen met * en eindigen met #. Via replace worden de tags vervangen door werkelijke waarde
  Compose() {
    let tekst: string = "Het zicht was #ZICHT#. De windrichting was #RICHTING# met #KRACHT#. " +
        "De wind had de volgende eigenschap(pen): #WIND_EIGENSCHAPPEN#. " +
        "Er was #BEWOLKING_DEKKING# bewolking en was #BEWOLKING# met een basis van #WOLKENBASIS# meter hoog. Het gemiddeld stijgen was #STIJGEN# m/s.";

    tekst = tekst.replace(/#ZICHT#/, (!this.zicht) ? "@@" : this.zicht.toLowerCase());
    tekst = tekst.replace(/#RICHTING#/, (!this.windRichting) ? "@@" : this.windRichting.toLowerCase());
    tekst = tekst.replace(/#KRACHT#/, (!this.windKracht) ? "@@" : this.windKracht.toLowerCase());
    tekst = tekst.replace(/#WIND_EIGENSCHAPPEN#/, (!this.windEigenschappen) ? "@@" : this.windEigenschappen.toLowerCase());
    tekst = tekst.replace(/#BEWOLKING#/, (!this.bewolking) ? "@@" : this.bewolking.toLowerCase());
    tekst = tekst.replace(/#BEWOLKING_DEKKING#/, (!this.bewolkingDekking) ? "@@" : this.bewolkingDekking.toLowerCase());
    tekst = tekst.replace(/#LUCHT_EIGENSCHAPPEN#/, (!this.zicht) ? "@@" : this.zicht.toLowerCase());
    tekst = tekst.replace(/#WOLKENBASIS#/, (!this.wolkenBasis) ? "@@" : this.wolkenBasis.toString());
    tekst = tekst.replace(/#STIJGEN#/, (!this.gemiddeldStijgen) ? "@@" :this.gemiddeldStijgen);

    this.opslaan.emit(tekst);
    this.popup.close();
  }

  // Tonen van het popup window met de wizard velden
  openPopup() {
    this.popup.open();
  }
}
