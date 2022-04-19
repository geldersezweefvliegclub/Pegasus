import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {DienstenService} from "../../../services/apiservice/diensten.service";
import {RoosterService} from "../../../services/apiservice/rooster.service";
import {HeliosDienst, HeliosDienstenDataset, HeliosRoosterDataset} from "../../../types/Helios";
import {DateTime} from "luxon";
import {ModalComponent} from "../modal/modal.component";


@Component({
    selector: 'app-dag-rooster',
    templateUrl: './dag-rooster.component.html',
    styleUrls: ['./dag-rooster.component.scss']
})
export class DagRoosterComponent {
    @Output() opslaan: EventEmitter<string> = new EventEmitter<string>();

    @Input() Datum: DateTime;
    @Input() magWijzigen: boolean = false;
    @ViewChild(ModalComponent) private popup: ModalComponent;

    rooster: HeliosRoosterDataset;
    diensten: HeliosDienstenDataset[];

    constructor(private readonly roosterService: RoosterService,
                private readonly dienstenService: DienstenService) {
    }

    // Open leden-filter dialoog met de leden-filter opties
    openPopup() {
        this.ophalen();
        this.popup.open();
    }

    ophalen(): void {
        if (this.Datum) {
            this.roosterService.getRooster(this.Datum, this.Datum).then(r => {
                this.rooster = r[0]
            })

            this.dienstenService.getDiensten(this.Datum, this.Datum).then(d => {
                this.diensten = d;
            })
        }
    }

    // Datum in de titel in het juiste formaat
    toonDatum() {
        return (this.Datum) ? this.Datum.day + "-" + this.Datum.month + "-" + this.Datum.year : "";
    }

    afwezig($event: Event, i: number) {
        if ((this.diensten[i].AANWEZIG) && (this.diensten[i].AFWEZIG)) {
            this.diensten[i].AANWEZIG = false;
        }
        this.diensten[i].ROOSTER_ID = -1; // indicatie dat afwezigheid is aangepast
    }

    aanwezig($event: Event, i: number) {
        if ((this.diensten[i].AANWEZIG) && (this.diensten[i].AFWEZIG)) {
            this.diensten[i].AFWEZIG = false;
        }
        // indicatie dat dienst is aangepast
        this.diensten[i].ROOSTER_ID = -1; // indicatie dat aanwezigheid is aangepast
    }

    opslaanData() {
        let aanwezigString: string = "";
        let afwezigString: string = "";
        let onbekendString: string = "";

        this.diensten.forEach((dienst) => {
            if (dienst.ROOSTER_ID! < 0) { // indicatie dat er een aanpassing is gedaan

                dienst.AANWEZIG = (dienst.AANWEZIG) ? true : false
                dienst.AFWEZIG = (dienst.AFWEZIG) ? true : false

                const update: HeliosDienst = {
                    ID: dienst.ID,
                    AANWEZIG: dienst.AANWEZIG,
                    AFWEZIG: dienst.AFWEZIG
                }
                this.dienstenService.updateDienst(update);
            }
            if (dienst.AANWEZIG) {
                aanwezigString += (aanwezigString.length == 0) ? dienst.NAAM : ', ' + dienst.NAAM
            } else if (dienst.AFWEZIG) {
                afwezigString += (afwezigString.length == 0) ? dienst.NAAM : ', ' + dienst.NAAM
            } else {
                onbekendString += (onbekendString.length == 0) ? dienst.NAAM : ', ' + dienst.NAAM
            }

        });

        let tekst: string = "";

        if (aanwezigString.length > 0) {
            tekst += 'Afwezig: ' + afwezigString  + '\n\n';
        }
        if (aanwezigString.length > 0) {
            tekst += 'Aanwezig: ' + aanwezigString + '\n\n';
        }
        if (aanwezigString.length > 0) {
            tekst += 'Onbekend: ' + onbekendString;
        }

        this.opslaan.emit(tekst);
        this.popup.close();
    }
}
