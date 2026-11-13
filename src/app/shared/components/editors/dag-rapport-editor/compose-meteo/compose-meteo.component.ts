import { Component, OnDestroy, inject, output, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { TypesService } from '../../../../../services/apiservice/types.service';
import { HeliosType } from '../../../../../types/Helios';
import { ModalComponent } from '../../../modal/modal.component';
import { FormsModule } from '@angular/forms';
import { IconButtonComponent } from '../../../icon-button/icon-button.component';

@Component({
    selector: 'app-compose-meteo',
    templateUrl: './compose-meteo.component.html',
    styleUrls: ['./compose-meteo.component.scss'],
    imports: [ModalComponent, FormsModule, IconButtonComponent]
})
export class ComposeMeteoComponent implements OnDestroy {
    readonly opslaan = output<string>();

    // variablen in html formulier
    protected windSterkteTypes: HeliosType[] = [];
    protected windRichtingTypes: HeliosType[] = [];
    protected windEigenschappenTypes: HeliosType[] = [];
    protected stijgenTypes: HeliosType[] = [];
    protected bewolkingTypes: HeliosType[] = [];
    protected dekkingTypes: HeliosType[] = [];
    protected zichtTypes: HeliosType[] = [];
    protected windRichting: string;
    protected windKracht: string;
    protected windEigenschappen: string;
    protected bewolking: string;
    protected bewolkingDekking: string;
    protected wolkenBasis: number;
    protected gemiddeldStijgen: string;
    protected zicht: string;

    // private variable voor ts script
    private readonly typesService = inject(TypesService);
    private readonly popup = viewChild.required(ModalComponent);

    private typesAbonnement: Subscription;

    constructor() {
        // abonneer op wijziging van competenties
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.windRichtingTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 2
            });
            this.windSterkteTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 3
            });
            this.bewolkingTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 11
            });
            this.windEigenschappenTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 12
            });
            this.zichtTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 13
            });
            this.stijgenTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 16
            });
            this.dekkingTypes = dataset!.filter((t: HeliosType) => {
                return t.GROEP == 17
            });
        });
    }

    ngOnDestroy(): void {
        if (this.typesAbonnement) this.typesAbonnement.unsubscribe();
    }

    // Alle tags beginnen met * en eindigen met #. Via replace worden de tags vervangen door werkelijke waarde
    protected Compose() {
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
        tekst = tekst.replace(/#STIJGEN#/, (!this.gemiddeldStijgen) ? "@@" : this.gemiddeldStijgen);

        this.opslaan.emit(tekst);
        this.popup().close();
    }

    // Tonen van het popup window met de wizard velden
    openPopup() {
        this.popup().open();
    }
}
