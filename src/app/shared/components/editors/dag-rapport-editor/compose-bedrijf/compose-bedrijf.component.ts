import { Component, ViewChild, inject, input, output } from '@angular/core';
import { ModalComponent } from '../../../modal/modal.component';
import { Observable, of, Subscription } from 'rxjs';
import { HeliosType } from '../../../../../types/Helios';
import { TypesService } from '../../../../../services/apiservice/types.service';
import { DateTime } from 'luxon';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { IconButtonComponent } from '../../../icon-button/icon-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-compose-bedrijf',
    templateUrl: './compose-bedrijf.component.html',
    styleUrls: ['./compose-bedrijf.component.scss'],
    imports: [ModalComponent, NgSelectComponent, FormsModule, IconButtonComponent, AsyncPipe]
})
export class ComposeBedrijfComponent {
    private readonly typesService = inject(TypesService);

    readonly datum = input.required<DateTime>();

    readonly opslaan = output<string>();
    @ViewChild(ModalComponent) private popup: ModalComponent;

    private typesAbonnement: Subscription;
    startMethodeTypes$: Observable<HeliosType[]>;
    clubTypes$: Observable<HeliosType[]>;
    baanTypes$: Observable<HeliosType[]>;
    luchtruimTypes$: Observable<HeliosType[]>;

    club: string;
    baan: string;
    startMethodes: [] = [];
    luchtruim: [] = [];
    linkerhandCircuit: boolean;
    rechterhandCircuit: boolean;

    constructor() {

        // abonneer op wijziging van lidTypes
        this.typesAbonnement = this.typesService.typesChange.subscribe(dataset => {
            this.baanTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 1}));
            this.startMethodeTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 5}));
            this.luchtruimTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 14}));
            this.clubTypes$ = of(dataset!.filter((t:HeliosType) => { return t.GROEP == 15}));
        });
    }

    // open het popup scherm voor de wizard
    openPopup() {
        this.popup.open();
    }

    // linkerhand circuit, dus niet rechtsom. Of LH = true of RH = true, beide false mag wel
    zetLH(isLinkerhand: boolean) {
        if (isLinkerhand) {
            this.rechterhandCircuit = false;
        }
    }

    // rechterhand circuit, dus niet linksom. Of LH = true of RH = true, beide false mag wel
    zetRH(isRechterhand: boolean) {
        if (isRechterhand) {
            this.linkerhandCircuit = false;
        }
    }

    Compose() {
        // dag van de week in een string stoppen
        let dagVDweek = "";
        const datum = this.datum();
        switch (datum.weekday) {
            case 1:
                dagVDweek = "maandag";
                break;
            case 2:
                dagVDweek = "dinsdag";
                break;
            case 3:
                dagVDweek = "woensdag";
                break;
            case 4:
                dagVDweek = "donderdag";
                break;
            case 5:
                dagVDweek = "vrijdag";
                break;
            case 6:
                dagVDweek = "zaterdag";
                break;
            case 7:
                dagVDweek = "zondag";
                break;
        }

        // string met datum in het nederlands
        let dmj = ""
        switch (datum.month) {
            case 1:
                dmj = datum.day + " januari " + datum.year;
                break;
            case 2:
                dmj = datum.day + " februari " + datum.year;
                break;
            case 3:
                dmj = datum.day + " maart " + datum.year;
                break;
            case 4:
                dmj = datum.day + " april " + datum.year;
                break;
            case 5:
                dmj = datum.day + " mei " + datum.year;
                break;
            case 6:
                dmj = datum.day + " juni " + datum.year;
                break;
            case 7:
                dmj = datum.day + " juli " + datum.year;
                break;
            case 8:
                dmj = datum.day + " augustus " + datum.year;
                break;
            case 9:
                dmj = datum.day + " september " + datum.year;
                break;
            case 10:
                dmj = datum.day + " oktober " + datum.year;
                break;
            case 11:
                dmj = datum.day + " november " + datum.year;
                break;
            case 12:
                dmj = datum.day + " december " + datum.year;
                break;
        }

        // opbouwen van de string met start methodes
        let sMethodes = ""
        for (let i = 0; i < this.startMethodes.length; i++) {
            if (i > 0) {
                if (i + 1 == this.startMethodes.length) {
                    sMethodes += " en "
                } else {
                    sMethodes += ", "
                }
            }
            sMethodes += this.startMethodes[i];
        }

        // en nu de string met circuit richting
        let circuitRichting = ""
        if (this.rechterhandCircuit) {
            circuitRichting = "met een rechterhand circuit.";
        }
        if (this.linkerhandCircuit) {
            circuitRichting = "met een linkerhand circuit.";
        }

        // nu het beschikbare luchtuim
        let luchtuim = "";
        if (this.luchtruim.length) {
            luchtuim = " Het volgende luchtruim was beschikbaar: ";

            for (let i = 0; i < this.luchtruim.length; i++) {
                if (i > 0) {
                    if (i + 1 == this.luchtruim.length) {
                        luchtuim += " en "
                    } else {
                        luchtuim += ", "
                    }
                }
                luchtuim += this.luchtruim[i];
            }
            luchtuim += ".";    // de zin netje afsluiten met een .
        }

        // Alle tags beginnen met * en eindigen met #. Via replace worden de tags vervangen door werkelijke waarde
        // die hierboven bepaald is
        let tekst: string = "Het dagverslag van #DAG_VD_WEEK# #DMJ# " +
            "onder leiding van de #CLUB#. " +
            "Het vliegbedrijf bevatte de volgende aspect(en): #START_METHODES# op de #BAAN# #CIRCUIT#";

        tekst = tekst.replace(/#DAG_VD_WEEK#/, dagVDweek);
        tekst = tekst.replace(/#DMJ#/, dmj);

        tekst = tekst.replace(/#CLUB#/, (!this.club) ? "@@" : this.club);
        tekst = tekst.replace(/#BAAN#/, this.baan);
        tekst = tekst.replace(/#START_METHODES#/, sMethodes);
        tekst = tekst.replace(/#CIRCUIT#/, circuitRichting);
        tekst += luchtuim;

        this.opslaan.emit(tekst);
        this.popup.close();
    }
}
