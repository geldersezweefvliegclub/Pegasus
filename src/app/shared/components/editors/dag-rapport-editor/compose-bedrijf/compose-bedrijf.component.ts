import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ModalComponent } from '../../../modal/modal.component';
import { Observable, of, Subscription } from 'rxjs';
import { HeliosType } from '../../../../../types/Helios';
import { TypesService } from '../../../../../services/apiservice/types.service';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-compose-bedrijf',
    templateUrl: './compose-bedrijf.component.html',
    styleUrls: ['./compose-bedrijf.component.scss']
})
export class ComposeBedrijfComponent {
    @Input() datum: DateTime;

    @Output() opslaan: EventEmitter<string> = new EventEmitter<string>();
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

    constructor(private readonly typesService: TypesService) {

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
        switch (this.datum.weekday) {
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
        switch (this.datum.month) {
            case 1:
                dmj = this.datum.day + " januari " + this.datum.year;
                break;
            case 2:
                dmj = this.datum.day + " februari " + this.datum.year;
                break;
            case 3:
                dmj = this.datum.day + " maart " + this.datum.year;
                break;
            case 4:
                dmj = this.datum.day + " april " + this.datum.year;
                break;
            case 5:
                dmj = this.datum.day + " mei " + this.datum.year;
                break;
            case 6:
                dmj = this.datum.day + " juni " + this.datum.year;
                break;
            case 7:
                dmj = this.datum.day + " juli " + this.datum.year;
                break;
            case 8:
                dmj = this.datum.day + " augustus " + this.datum.year;
                break;
            case 9:
                dmj = this.datum.day + " september " + this.datum.year;
                break;
            case 10:
                dmj = this.datum.day + " oktober " + this.datum.year;
                break;
            case 11:
                dmj = this.datum.day + " november " + this.datum.year;
                break;
            case 12:
                dmj = this.datum.day + " december " + this.datum.year;
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
